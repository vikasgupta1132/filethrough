# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: filethrough.spec.ts >> FileThrough detects dynamic upload input
- Location: tests\filethrough.spec.ts:3:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/test-upload.html
Call log:
  - navigating to "http://127.0.0.1:4173/test-upload.html", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: 127.0.0.1
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('FileThrough detects dynamic upload input', async ({ page }) => {
> 4  |   await page.goto('http://127.0.0.1:4173/test-upload.html');
     |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/test-upload.html
  5  | 
  6  |   const fileInput = page.locator('input[type="file"]');
  7  | 
  8  | await page.waitForTimeout(3000);
  9  | 
  10 | await expect(fileInput).toBeVisible({
  11 |   timeout: 5000,
  12 | });
  13 | 
  14 |   await expect(fileInput).toHaveAttribute(
  15 |     'accept',
  16 |     '.jpg,.jpeg'
  17 |   );
  18 | });
```