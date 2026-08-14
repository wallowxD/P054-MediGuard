"""Validation ảnh đơn thuốc và exception miền; không lưu file hay gọi provider."""

from dataclasses import dataclass
from io import BytesIO

from PIL import Image, ImageOps, UnidentifiedImageError

SUPPORTED_IMAGE_MIME_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
_MIME_BY_FORMAT = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}


class PrescriptionExtractionError(Exception):
    code = "prescription_extraction_error"

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


class InvalidPrescriptionImageError(PrescriptionExtractionError):
    code = "invalid_prescription_image"


class PrescriptionImageLimitError(PrescriptionExtractionError):
    code = "prescription_image_limit"


class PrescriptionExtractionUnavailableError(PrescriptionExtractionError):
    code = "prescription_extraction_unavailable"


class PrescriptionExtractionTimeoutError(PrescriptionExtractionError):
    code = "prescription_extraction_timeout"


@dataclass(frozen=True, slots=True)
class PrescriptionImageInput:
    data: bytes
    declared_mime_type: str


@dataclass(frozen=True, slots=True)
class PreparedPrescriptionImage:
    data: bytes
    mime_type: str
    width: int
    height: int


def prepare_prescription_image(
    image_input: PrescriptionImageInput,
    *,
    max_file_size_bytes: int,
    max_pixels: int,
) -> PreparedPrescriptionImage:
    """Kiểm tra signature/dimension và re-encode trong RAM để bỏ EXIF/metadata."""
    if image_input.declared_mime_type not in SUPPORTED_IMAGE_MIME_TYPES:
        raise InvalidPrescriptionImageError("Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WEBP.")
    if not image_input.data:
        raise InvalidPrescriptionImageError("Ảnh đơn thuốc đang rỗng.")
    if len(image_input.data) > max_file_size_bytes:
        raise PrescriptionImageLimitError("Mỗi ảnh đơn thuốc không được vượt quá 10 MB.")

    try:
        with Image.open(BytesIO(image_input.data)) as source:
            detected_mime_type = _MIME_BY_FORMAT.get(source.format or "")
            if detected_mime_type is None or detected_mime_type != image_input.declared_mime_type:
                raise InvalidPrescriptionImageError("Nội dung ảnh không khớp định dạng đã khai báo.")
            width, height = source.size
            if width <= 0 or height <= 0 or width * height > max_pixels:
                raise PrescriptionImageLimitError("Độ phân giải ảnh vượt quá giới hạn xử lý.")
            source.load()
            normalized = ImageOps.exif_transpose(source)
            if detected_mime_type == "image/jpeg":
                normalized = normalized.convert("RGB")
            elif normalized.mode not in {"RGB", "RGBA", "L"}:
                normalized = normalized.convert("RGBA" if "A" in normalized.getbands() else "RGB")

            output = BytesIO()
            save_format = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}[detected_mime_type]
            save_options: dict[str, object] = {"optimize": True}
            if detected_mime_type in {"image/jpeg", "image/webp"}:
                save_options["quality"] = 92
            normalized.save(output, format=save_format, **save_options)
    except PrescriptionExtractionError:
        raise
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise InvalidPrescriptionImageError("Không thể đọc ảnh đơn thuốc. Hãy chọn ảnh rõ nét khác.") from exc

    return PreparedPrescriptionImage(
        data=output.getvalue(),
        mime_type=detected_mime_type,
        width=width,
        height=height,
    )
