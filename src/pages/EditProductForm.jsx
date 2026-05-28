from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import io

from app.db.database import get_db
from app.schemas.image import ImageOut, ImageCreate
from app.crud import image as crud_image
from app.services.storage import (
    upload_product_image,
    upload_profile_image,
    delete_product_image,
    delete_profile_image,
    get_product_image_url,
    get_profile_image_url,
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/images", tags=["Images"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

MAGIC_SIGNATURES = [
    (b'\xff\xd8\xff',       'jpeg'),
    (b'\x89PNG\r\n\x1a\n', 'png'),
    (b'RIFF',               'webp'),
]


async def validate_image_file(file: UploadFile) -> bytes:
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="El archivo supera el límite de 5 MB")
    if len(contents) < 12:
        raise HTTPException(status_code=400, detail="Archivo demasiado pequeño para ser una imagen")

    header   = contents[:12]
    detected = None
    for magic, fmt in MAGIC_SIGNATURES:
        if header[:len(magic)] == magic:
            if fmt == 'webp' and header[8:12] != b'WEBP':
                continue
            detected = fmt
            break

    if not detected:
        raise HTTPException(status_code=400, detail="Formato no permitido. Solo se aceptan JPG, PNG o WEBP.")

    try:
        from PIL import Image
        Image.open(io.BytesIO(contents)).verify()
    except Exception:
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida o está corrupto")

    return contents


def reset_upload_file(contents: bytes, original: UploadFile) -> UploadFile:
    original.file = io.BytesIO(contents)
    return original


def _is_legacy_url(value: str) -> bool:
    """Las imágenes subidas antes del cambio tienen URL pública de GCS."""
    return value.startswith("https://storage.googleapis.com/")


def _sign_image(image, getter_fn) -> dict:
    """Retorna el objeto imagen con image_url reemplazada por URL firmada."""
    d = image.__dict__.copy()
    try:
        d["image_url"] = getter_fn(image.image_url)
    except Exception:
        pass  # Si falla la firma, devolver el valor original
    return d


# ─── Producto ─────────────────────────────────────────────────────────────────

@router.post("/product/{product_id}", response_model=ImageOut, status_code=201)
async def upload_product_image_endpoint(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = False,
    position: int = 0,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    contents  = await validate_image_file(file)
    file      = reset_upload_file(contents, file)
    blob_name = upload_product_image(file, product_id)
    print(f"[upload] blob_name={blob_name} product_id={product_id} is_primary={is_primary}")
    return crud_image.create_image(db, image=ImageCreate(
        image_url=blob_name,
        is_primary=is_primary,
        position=position,
        product_id=product_id,
        created_at=datetime.utcnow()
    ))


@router.get("/product/{product_id}", response_model=List[ImageOut])
def get_product_images(product_id: int, db: Session = Depends(get_db)):
    from fastapi.responses import JSONResponse
    images = crud_image.get_images_by_product(db, product_id)
    result = []
    for img in images:
        try:
            signed = get_product_image_url(img.image_url)
        except Exception:
            signed = img.image_url
        img_dict = {c.key: getattr(img, c.key) for c in img.__table__.columns}
        img_dict["image_url"] = signed
        result.append(img_dict)
    # Cache por 1 hora — las imágenes de productos no cambian frecuentemente
    return JSONResponse(content=result, headers={"Cache-Control": "public, max-age=3600"})


@router.patch("/product/{product_id}/primary/{image_id}", response_model=ImageOut)
def set_primary(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    image = crud_image.set_primary_image(db, product_id, image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    return image


# ─── Perfil ───────────────────────────────────────────────────────────────────

@router.post("/profile", response_model=ImageOut, status_code=201)
async def upload_profile_image_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    contents = await validate_image_file(file)
    file     = reset_upload_file(contents, file)

    existing = crud_image.get_image_by_user(db, user.user_id)
    if existing:
        delete_profile_image(existing.image_url)
        crud_image.delete_image(db, existing.image_id)

    blob_name = upload_profile_image(file, user.user_id)
    return crud_image.create_image(db, image=ImageCreate(
        image_url=blob_name,
        is_primary=True,
        user_id=user.user_id,
        created_at=datetime.utcnow()
    ))


@router.get("/profile/{user_id}", response_model=ImageOut)
def get_profile_image(user_id: int, db: Session = Depends(get_db)):
    image = crud_image.get_image_by_user(db, user_id)
    if not image:
        raise HTTPException(status_code=404, detail="Imagen de perfil no encontrada")
    try:
        signed = get_profile_image_url(image.image_url)
    except Exception:
        signed = image.image_url
    img_dict = {c.key: getattr(image, c.key) for c in image.__table__.columns}
    img_dict["image_url"] = signed
    return img_dict


# ─── Eliminar ─────────────────────────────────────────────────────────────────

@router.delete("/{image_id}", response_model=ImageOut)
def delete_image(
    image_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    db_image = crud_image.get_image(db, image_id)
    if not db_image:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")

    if db_image.product_id:
        delete_product_image(db_image.image_url)
    elif db_image.user_id:
        delete_profile_image(db_image.image_url)

    return crud_image.delete_image(db, image_id)
