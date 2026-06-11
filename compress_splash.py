import os
try:
    from PIL import Image
except ImportError:
    os.system("pip install Pillow")
    from PIL import Image

def compress_images():
    count = 0
    saved_bytes = 0
    res_dir = r"android\app\src\main\res"
    for root, dirs, files in os.walk(res_dir):
        for file in files:
            if file == "splash.png":
                path = os.path.join(root, file)
                original_size = os.path.getsize(path)
                try:
                    with Image.open(path) as img:
                        # Determine target size based on folder density
                        # To keep it simple, just downscale massive images
                        if img.width > 1200 or img.height > 1200:
                            img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
                        
                        # Save with optimization
                        img.save(path, format="PNG", optimize=True)
                        
                    new_size = os.path.getsize(path)
                    saved_bytes += (original_size - new_size)
                    count += 1
                except Exception as e:
                    print(f"Failed on {path}: {e}")
                    
    print(f"Compressed {count} splash screens. Saved {saved_bytes / (1024*1024):.2f} MB!")

if __name__ == "__main__":
    compress_images()
