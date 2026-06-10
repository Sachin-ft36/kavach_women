import os
from PIL import Image

def resize_image(source_path, target_path, size):
    with Image.open(source_path) as img:
        # Resize using high-quality Lanczos filter
        resized_img = img.resize(size, Image.Resampling.LANCZOS)
        # Ensure target directory exists
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        # Save image
        resized_img.save(target_path, format="PNG")
        print(f"Generated: {target_path} ({size[0]}x{size[1]})")

def main():
    source_img = "public/logo.jpeg"
    res_dir = "android/app/src/main/res"
    
    # Target densities and sizes
    # format: (directory_suffix, standard_icon_size, foreground_icon_size)
    configs = [
        ("mdpi", (48, 48), (108, 108)),
        ("hdpi", (72, 72), (162, 162)),
        ("xhdpi", (96, 96), (216, 216)),
        ("xxhdpi", (144, 144), (324, 324)),
        ("xxxhdpi", (192, 192), (432, 432))
    ]
    
    for suffix, std_size, fore_size in configs:
        folder = os.path.join(res_dir, f"mipmap-{suffix}")
        
        # Standard launcher icon
        std_path = os.path.join(folder, "ic_launcher.png")
        resize_image(source_img, std_path, std_size)
        
        # Round launcher icon
        round_path = os.path.join(folder, "ic_launcher_round.png")
        resize_image(source_img, round_path, std_size)
        
        # Foreground adaptive layer
        fore_path = os.path.join(folder, "ic_launcher_foreground.png")
        resize_image(source_img, fore_path, fore_size)

    # Delete the duplicate high-res foreground from mipmap-anydpi-v26
    any_dpi_fore_path = os.path.join(res_dir, "mipmap-anydpi-v26", "ic_launcher_foreground.png")
    if os.path.exists(any_dpi_fore_path):
        os.remove(any_dpi_fore_path)
        print(f"Successfully deleted duplicate/oversized anydpi file: {any_dpi_fore_path}")
    else:
        print(f"Oversized anydpi file already deleted or not found: {any_dpi_fore_path}")

if __name__ == "__main__":
    main()
