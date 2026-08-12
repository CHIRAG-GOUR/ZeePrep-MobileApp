import os
from PIL import Image, ImageDraw

def draw_zeeprep_brand_mark(draw, bx, by, bw, bh, is_monochrome=False):
    # Geometrically balanced, stylized "Z" symbol + graduation cap accent
    # Colors
    white = (255, 255, 255, 255)
    gold = (253, 224, 71, 255)
    
    # 1. Graduation Cap Accent on Top
    cap_cx = bx + bw * 0.5
    cap_cy = by + bh * 0.24
    cap_w = bw * 0.32
    cap_h = bh * 0.12
    cap_points = [
        (cap_cx, cap_cy - cap_h),
        (cap_cx + cap_w, cap_cy),
        (cap_cx, cap_cy + cap_h),
        (cap_cx - cap_w, cap_cy)
    ]
    draw.polygon(cap_points, fill=white)

    # Tassel
    if not is_monochrome:
        draw.line([(cap_cx + cap_w * 0.78, cap_cy), (cap_cx + cap_w * 0.84, cap_cy + cap_h * 1.4)], fill=gold, width=max(2, int(bw * 0.035)))
        draw.ellipse([cap_cx + cap_w * 0.80, cap_cy + cap_h * 1.3, cap_cx + cap_w * 0.88, cap_cy + cap_h * 1.6], fill=gold)

    # 2. Bold Geometric Z Symbol
    z_left = bx + bw * 0.26
    z_right = bx + bw * 0.74
    z_top = by + bh * 0.40
    z_bottom = by + bh * 0.82
    stroke_w = max(3, int(bw * 0.125))

    # Top horizontal bar of Z
    draw.line([(z_left, z_top), (z_right, z_top)], fill=white, width=stroke_w)
    # Diagonal stroke of Z
    draw.line([(z_right, z_top), (z_left, z_bottom)], fill=white, width=stroke_w)
    # Bottom horizontal bar of Z
    draw.line([(z_left, z_bottom), (z_right, z_bottom)], fill=white, width=stroke_w)

def draw_zeeprep_icon(size, transparent_bg=False, padding_ratio=0.15, is_monochrome=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if is_monochrome:
        # Monochrome icon MUST have a 100% transparent background with ONLY the white Z emblem
        # so Android themed icons can tint the Z emblem cleanly without any white box artifact
        pad = size * 0.20
        bw = size - (2 * pad)
        draw_zeeprep_brand_mark(draw, pad, pad, bw, bw, is_monochrome=True)
        return img

    # Background layer
    if not transparent_bg:
        # Clean light slate background matching #F8FAFC
        draw.rectangle([0, 0, size, size], fill=(248, 250, 252, 255))
        
        # Subtle ambient radial glow circle
        center = size / 2.0
        r_glow = size * 0.44
        draw.ellipse(
            [center - r_glow, center - r_glow, center + r_glow, center + r_glow],
            fill=(219, 234, 254, 255)
        )

    # Safe zone badge
    pad = size * padding_ratio
    badge_rect = [pad, pad, size - pad, size - pad]
    badge_size = size - (2 * pad)

    # Draw rounded royal blue badge (#2563EB)
    badge_radius = badge_size * 0.28
    draw.rounded_rectangle(
        badge_rect,
        radius=badge_radius,
        fill=(37, 99, 235, 255),
        outline=(96, 165, 250, 255),
        width=max(1, int(size * 0.015))
    )

    # Draw Z brand mark inside badge
    draw_zeeprep_brand_mark(draw, badge_rect[0], badge_rect[1], badge_size, badge_size, is_monochrome=False)

    return img

def main():
    base_dir = r"E:\1. Skillizee\Zee Prep - Mobile App"
    
    # 1. Generate core image assets for Expo & iOS
    sizes = {
        "assets/images/icon.png": (1024, False, 0.10, False),
        "assets/images/splash-icon.png": (1024, False, 0.15, False),
        "assets/images/android-icon-foreground.png": (432, True, 0.20, False),
        "assets/images/android-icon-background.png": (432, False, 0.0, False),
        "assets/images/android-icon-monochrome.png": (432, True, 0.20, True),
    }

    for rel_path, (sz, trans, pad, mono) in sizes.items():
        full_path = os.path.join(base_dir, rel_path)
        img = draw_zeeprep_icon(sz, transparent_bg=trans, padding_ratio=pad, is_monochrome=mono)
        img.save(full_path, "PNG")
        print(f"Generated {rel_path} ({sz}x{sz})")

    # 2. Generate Mipmap densities for Android
    mipmaps = [
        ("mipmap-mdpi", 48, 108),
        ("mipmap-hdpi", 72, 162),
        ("mipmap-xhdpi", 96, 216),
        ("mipmap-xxhdpi", 144, 324),
        ("mipmap-xxxhdpi", 192, 432),
    ]

    for folder, icon_sz, fg_sz in mipmaps:
        res_dir = os.path.join(base_dir, "android", "app", "src", "main", "res", folder)
        os.makedirs(res_dir, exist_ok=True)

        # Remove any existing png files in mipmap folders to prevent duplicate resource conflicts
        for name in ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png", "ic_launcher_background.png", "ic_launcher_monochrome.png"]:
            png_p = os.path.join(res_dir, name)
            if os.path.exists(png_p):
                os.remove(png_p)

        # Full icon webp
        full_icon = draw_zeeprep_icon(icon_sz, transparent_bg=False, padding_ratio=0.10, is_monochrome=False)
        full_icon.save(os.path.join(res_dir, "ic_launcher.webp"), "WEBP")
        full_icon.save(os.path.join(res_dir, "ic_launcher_round.webp"), "WEBP")

        # Foreground webp
        fg_icon = draw_zeeprep_icon(fg_sz, transparent_bg=True, padding_ratio=0.22, is_monochrome=False)
        fg_icon.save(os.path.join(res_dir, "ic_launcher_foreground.webp"), "WEBP")

        # Monochrome Z logo webp (Transparent background + White Z silhouette ONLY)
        mono_icon = draw_zeeprep_icon(fg_sz, transparent_bg=True, padding_ratio=0.22, is_monochrome=True)
        mono_icon.save(os.path.join(res_dir, "ic_launcher_monochrome.webp"), "WEBP")

        # Background webp
        bg_img = Image.new("RGBA", (fg_sz, fg_sz), (248, 250, 252, 255))
        bg_img.save(os.path.join(res_dir, "ic_launcher_background.webp"), "WEBP")

        # Splash logo drawable
        splash_logo = draw_zeeprep_icon(fg_sz, transparent_bg=True, padding_ratio=0.18, is_monochrome=False)
        draw_dir = os.path.join(base_dir, "android", "app", "src", "main", "res", folder.replace("mipmap-", "drawable-"))
        os.makedirs(draw_dir, exist_ok=True)
        splash_logo.save(os.path.join(draw_dir, "splashscreen_logo.png"), "PNG")

        print(f"Generated clean adaptive & monochrome Z icons for {folder}")

if __name__ == "__main__":
    main()
