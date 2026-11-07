import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const script = String.raw`
import asyncio,json,os,sys
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  context=await browser.new_context(viewport={"width":1280,"height":1800})
  page=await context.new_page()
  key=os.environ['LOVABLE_BROWSER_SUPABASE_STORAGE_KEY']
  session=os.environ['LOVABLE_BROWSER_SUPABASE_SESSION_JSON']
  cookies=json.loads(os.environ.get('LOVABLE_BROWSER_SUPABASE_COOKIES_JSON') or '[]')
  if cookies: await context.add_cookies([{**c,'url':'http://localhost:8080'} for c in cookies])
  await page.goto('http://localhost:8080')
  await page.evaluate('([k,v])=>localStorage.setItem(k,v)',[key,session])
  await page.goto('http://localhost:8080/admin/doctors')
  row=page.get_by_role('row').filter(has_text='ডা. ফোরহাদ হোসেন')
  await row.wait_for()
  label='যাচাইকৃত' if sys.argv[1]=='verified' else 'বিশেষ'
  check=row.get_by_label(label,exact=True)
  original=await check.is_checked()
  async def change():
   await check.click()
   await page.wait_for_timeout(800)
  try:
   if original: await change()
   await change()
   assert await check.is_checked(), 'Admin badge assignment failed'
   await page.goto('http://localhost:8080')
   card=page.locator('#doctors a').filter(has_text='ডা. ফোরহাদ হোসেন')
   await card.get_by_text(label,exact=True).wait_for()
   await card.screenshot(path='/tmp/browser/doctor-badges/'+sys.argv[1]+'.png')
   await card.click()
   await page.locator('main').get_by_text(label,exact=True).wait_for()
   await page.goto('http://localhost:8080/doctors')
   await page.get_by_text(label,exact=True).filter(visible=True).first.wait_for()
   await page.goto('http://localhost:8080/admin/doctors')
   await row.wait_for()
   await change()
   assert not await check.is_checked(), 'Admin badge removal failed'
   await page.goto('http://localhost:8080')
   await card.wait_for()
   assert await card.get_by_text(label,exact=True).count()==0, 'Removed badge still visible'
   print('verified')
  finally:
   await page.goto('http://localhost:8080/admin/doctors')
   await row.wait_for()
   if await check.is_checked()!=original: await change()
   await browser.close()
asyncio.run(main())
`;

describe.skipIf(process.env["RUN_LIVE_BADGE_TESTS"] !== "1")("admin doctor badges", () => {
  for (const badge of ["verified", "special"]) {
    it(`admin can award and remove the ${badge} badge on public doctor surfaces`, () => {
      mkdirSync("/tmp/browser/doctor-badges", { recursive: true });
      writeFileSync("/tmp/browser/doctor-badges/check_badges.py", script);
      expect(execFileSync("python3", ["/tmp/browser/doctor-badges/check_badges.py", badge], { encoding: "utf8", timeout: 60000 }).trim()).toBe("verified");
    }, 65000);
  }
});