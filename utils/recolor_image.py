from PIL import Image
import numpy as np

# Define base and target colors
base_color = np.array([80, 216, 175])       # #50D8AF
target_color = np.array([247, 166, 20])     # #F7A614
preserve_color = np.array([255, 255, 255])  # #FFFFFF (ignore fully transparent too)

# Load the image
im = Image.open("preloader.gif")
frames = []

def recolor_pixel(pixel):
    if pixel[3] == 0:  # Fully transparent, skip
        return pixel
    rgb = np.array(pixel[:3])
    if np.all(rgb == preserve_color):
        return pixel

    # Calculate color difference (distance) from base color
    delta = rgb - base_color

    # Apply delta to target color
    new_rgb = np.clip(target_color + delta, 0, 255).astype(np.uint8)

    return tuple(new_rgb.tolist() + [pixel[3]])  # RGBA

# Process all frames
for frame in range(im.n_frames):
    im.seek(frame)
    rgba = im.convert("RGBA")
    pixels = np.array(rgba)

    # Vectorized recoloring
    flat_pixels = pixels.reshape(-1, 4)
    new_pixels = np.array([recolor_pixel(p) for p in flat_pixels])
    new_pixels = new_pixels.reshape(pixels.shape).astype(np.uint8)

    new_image = Image.fromarray(new_pixels, mode="RGBA")
    frames.append(new_image)

# Save as new GIF
frames[0].save(
    "preloader_recolored.gif",
    save_all=True,
    append_images=frames[1:],
    duration=im.info.get("duration", 100),
    loop=0,
    disposal=2,
    transparency=0
)
