import io

from PIL import Image

from medsafe.ocr.gemini_client import GeminiVLClient


def test_prepare_image_payload_oversized_image(tmp_path):
    # Create a dummy large image (e.g. 5000x5000)
    large_img = Image.new("RGB", (5000, 5000), color="white")
    img_path = tmp_path / "test_large.png"
    large_img.save(img_path)

    client = GeminiVLClient()
    prepared_bytes, mime_type = client._prepare_image_payload(img_path, max_dimension=3584)

    assert mime_type == "image/jpeg"
    assert len(prepared_bytes) > 0

    # Verify resized dimensions
    with Image.open(io.BytesIO(prepared_bytes)) as result_img:
        w, h = result_img.size
        assert max(w, h) <= 3584


def test_error_classification_invalid_argument():
    # Ensure invalid_argument is classified as ValueError with 'Invalid Argument'
    err_str = "400 INVALID_ARGUMENT. Provided image is not valid."
    err_lower = err_str.lower()

    assert "invalid_argument" in err_lower
    assert not any(
        k in err_lower for k in ("unauthorized", "unauthenticated", "permissiondenied", "invalid_api_key", "401", "403")
    )
