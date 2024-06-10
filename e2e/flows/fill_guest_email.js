import { guestUser } from "../data/user";

async function fillGuestEmail(page) {
  await page.locator("#email-guest").fill(guestUser.email);
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page.waitForTimeout(2000);
}

export default fillGuestEmail;
