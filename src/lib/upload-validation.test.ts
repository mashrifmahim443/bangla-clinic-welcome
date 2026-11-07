import { describe, expect, it } from "vitest";
import { isAllowedDocumentFile } from "@/components/consult/old-prescriptions";

function fakeFile(name: string, type: string): File {
  return new File(["x"], name, { type });
}

describe("prescription upload validation", () => {
  it("allows JPG, JPEG, PNG and PDF", () => {
    expect(isAllowedDocumentFile(fakeFile("rx.jpg", "image/jpeg"))).toBe(true);
    expect(isAllowedDocumentFile(fakeFile("rx.jpeg", "image/jpeg"))).toBe(true);
    expect(isAllowedDocumentFile(fakeFile("rx.png", "image/png"))).toBe(true);
    expect(isAllowedDocumentFile(fakeFile("rx.pdf", "application/pdf"))).toBe(true);
  });

  it("rejects other image formats like GIF, WebP and SVG", () => {
    expect(isAllowedDocumentFile(fakeFile("rx.gif", "image/gif"))).toBe(false);
    expect(isAllowedDocumentFile(fakeFile("rx.webp", "image/webp"))).toBe(false);
    expect(isAllowedDocumentFile(fakeFile("rx.svg", "image/svg+xml"))).toBe(false);
  });

  it("rejects when MIME type and extension disagree", () => {
    expect(isAllowedDocumentFile(fakeFile("rx.exe", "image/png"))).toBe(false);
    expect(isAllowedDocumentFile(fakeFile("rx.png", "application/octet-stream"))).toBe(false);
  });
});
