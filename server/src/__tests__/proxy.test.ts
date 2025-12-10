process.env.NODE_ENV = "test";
import request from "supertest";
import app from "../index";

const mockFetch = jest.fn();

describe("proxy routes", () => {
  beforeAll(() => {
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it("returns subreddit listing", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: { children: [] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await request(app).get("/api/r/test").expect(200);
    expect(res.headers["x-cache-status"]).toBe("MISS");
  });

  it("returns post details", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: { children: [{ data: { id: "abc" } }] } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await request(app).get("/api/post/abc").expect(200);
    expect(res.body.data.children[0].data.id).toBe("abc");
  });

  it("rejects missing search query", async () => {
    const res = await request(app).get("/api/search").expect(400);
    expect(res.body.error).toBeDefined();
  });

  it("handles upstream failure", async () => {
    mockFetch.mockResolvedValue(
      new Response("{}", {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );

    const res = await request(app).get("/api/r/fail").expect(502);
    expect(res.body.error).toBe("Upstream service unavailable");
  });
});
