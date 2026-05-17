import asyncio
import os

async def render_all():
    from playwright.async_api import async_playwright
    
    diagrams_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    html_dir = os.path.join(diagrams_dir, 'html')
    
    html_files = [f for f in os.listdir(html_dir) if f.endswith('.html')]
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for html_file in sorted(html_files):
            html_path = os.path.join(html_dir, html_file)
            png_name = html_file.replace('.html', '.png')
            png_path = os.path.join(diagrams_dir, png_name)
            
            page = await browser.new_page(
                viewport={'width': 1700, 'height': 1200},
                device_scale_factor=2
            )
            
            try:
                await page.goto(f'file://{html_path}', wait_until='networkidle', timeout=15000)
                await page.wait_for_timeout(500)
                
                el = page.locator('#root')
                bbox = await el.bounding_box()
                
                if bbox:
                    fit_w = max(1700, int(bbox['width'] + 120))
                    fit_h = int(bbox['height'] + 120)
                    await page.set_viewport_size({'width': fit_w, 'height': fit_h})
                    await page.wait_for_timeout(200)
                
                await el.screenshot(path=png_path)
                size = os.path.getsize(png_path)
                print(f'✅ {png_name} ({size/1024:.0f}KB)')
            except Exception as e:
                print(f'❌ {html_file}: {e}')
            finally:
                await page.close()
        
        await browser.close()

asyncio.run(render_all())
