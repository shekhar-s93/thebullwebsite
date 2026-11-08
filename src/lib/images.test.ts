import { describe, expect, it } from "vitest";

import { extractGoogleDriveId, resolveImageUrl } from "./images";

const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";

describe("Google Drive image links", () => {
  it("extracts the file ID from a standard sharing link", () => {
    expect(extractGoogleDriveId(`https://drive.google.com/file/d/${ID}/view?usp=sharing`)).toBe(ID);
  });

  it("extracts the file ID from open?id= and uc?id= links", () => {
    expect(extractGoogleDriveId(`https://drive.google.com/open?id=${ID}`)).toBe(ID);
    expect(extractGoogleDriveId(`https://drive.google.com/uc?export=view&id=${ID}`)).toBe(ID);
  });

  it("converts a sharing link into a displayable image URL", () => {
    const r = resolveImageUrl(`https://drive.google.com/file/d/${ID}/view?usp=sharing`);
    expect(r).toEqual({ ok: true, url: `https://lh3.googleusercontent.com/d/${ID}=w1600`, driveId: ID });
  });

  it("rejects folder links", () => {
    expect(resolveImageUrl("https://drive.google.com/drive/folders/1abcdefghijklmnop").ok).toBe(false);
  });

  it("keeps ordinary image URLs unchanged and rejects non-http links", () => {
    expect(resolveImageUrl("https://example.com/a.png")).toEqual({ ok: true, url: "https://example.com/a.png", driveId: null });
    expect(resolveImageUrl("javascript:alert(1)").ok).toBe(false);
  });
});
