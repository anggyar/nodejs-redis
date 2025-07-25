import Redis from "ioredis";

describe("redis", () => {
    let redis = null;

    beforeEach(async () => {
        redis = new Redis({
            host: "localhost",
            port: 6379,
            db: 0,
        });
    });

    afterEach(async () => {
        await redis.quit();
    });

    it("should can ping", async () => {
        const pong = await redis.ping();
        expect(pong).toBe("PONG");
    });

    it("should support string", async () => {
        await redis.setex("name", 2, "Anggy");

        let name = await redis.get("name");
        expect(name).toBe("Anggy");

        // sleep 5 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));
        name = await redis.get("name");
        expect(name).toBeNull();
    });

    it("should support list", async () => {
        await redis.rpush("names", "Anggyar");
        await redis.rpush("names", "Muhamad");
        await redis.rpush("names", "Yahya");

        expect(await redis.llen("names")).toBe(3);

        const names = await redis.lrange("names", 0, -1);
        expect(names).toEqual(["Anggyar", "Muhamad", "Yahya"]);

        expect(await redis.lpop("names")).toBe("Anggyar");
        expect(await redis.rpop("names")).toBe("Yahya");

        expect(await redis.llen("names")).toBe(1);

        await redis.del("names");
    });

    it("should support set", async () => {
        await redis.sadd("names", "Anggyar");
        await redis.sadd("names", "Anggyar");
        await redis.sadd("names", "Muhamad");
        await redis.sadd("names", "Muhamad");
        await redis.sadd("names", "Yahya");
        await redis.sadd("names", "Yahya");

        expect(await redis.scard("names")).toBe(3);

        const names = await redis.smembers("names");
        expect(names).toEqual(["Anggyar", "Muhamad", "Yahya"]);

        await redis.del("names");
    });

    it("should support set", async () => {
        await redis.sadd("names", "Anggyar");
        await redis.sadd("names", "Anggyar");
        await redis.sadd("names", "Muhamad");
        await redis.sadd("names", "Muhamad");
        await redis.sadd("names", "Yahya");
        await redis.sadd("names", "Yahya");

        expect(await redis.scard("names")).toBe(3);

        const names = await redis.smembers("names");
        expect(names).toEqual(["Anggyar", "Muhamad", "Yahya"]);

        await redis.del("names");
    });

    it("should support sorted set", async () => {
        await redis.zadd("names", 100, "Anggyar");
        await redis.zadd("names", 85, "Budi");
        await redis.zadd("names", 95, "Christantyo");

        expect(await redis.zcard("names")).toBe(3);

        const names = await redis.zrange("names", 0, -1);
        expect(names).toEqual(["Budi", "Christantyo", "Anggyar"]);

        expect(await redis.zpopmax("names")).toEqual(["Anggyar", "100"]);
        expect(await redis.zpopmax("names")).toEqual(["Christantyo", "95"]);
        expect(await redis.zpopmax("names")).toEqual(["Budi", "85"]);

        await redis.del("names");
    });

    it("should support hash", async () => {
        await redis.hset("user:1", {
            id: "1",
            name: "anggyar",
            email: "anggyar@mail.com",
        });
        const user = await redis.hgetall("user:1");

        expect(user).toEqual({
            id: "1",
            name: "anggyar",
            email: "anggyar@mail.com",
        });

        await redis.del("user:1");
    });

    it("should support geo points", async () => {
        await redis.geoadd(
            "sellers",
            101.39341691630248,
            1.5858070664874735,

            "Jadi Ria Bakso"
        );
        await redis.geoadd(
            "sellers",
            101.42603786041953,
            1.6085730465597408,

            "Ampera bu Dinda"
        );

        const distance = await redis.geodist(
            "sellers",
            "Jadi Ria Bakso",
            "Ampera bu Dinda",
            "M"
        );

        expect(distance).toBe(String(4423.4446));

        const result = await redis.geosearch(
            "sellers",
            "fromlonlat",
            101.406891,
            1.597734,
            "byradius",
            5,
            "km"
        );
        expect(result).toEqual(["Jadi Ria Bakso", "Ampera bu Dinda"]);
    });

    it("should support hyper log log", async () => {
        await redis.pfadd("visitors", "anggy", "muhammad", "yahya");
        await redis.pfadd("visitors", "anggy", "budi", "joko");
        await redis.pfadd("visitors", "tyo", "budi", "joko");

        const total = await redis.pfcount("visitors");
        expect(total).toBe(6);
    });

    it("should support pipeline", async () => {
        const pipeline = redis.pipeline();

        pipeline.setex("name", 2, "Anggy");
        pipeline.setex("address", 2, "Indonesia");

        await pipeline.exec();

        expect(await redis.get("name")).toBe("Anggy");
        expect(await redis.get("address")).toBe("Indonesia");
    });

    it("should support transaction", async () => {
        const multi = redis.multi();

        multi.setex("name", 2, "Anggy");
        multi.setex("address", 2, "Indonesia");

        await multi.exec();

        expect(await redis.get("name")).toBe("Anggy");
        expect(await redis.get("address")).toBe("Indonesia");
    });

    it("should support publish stream", async () => {
        for (let i = 0; i < 10; i++) {
            await redis.xadd(
                "members",
                "*",
                "name",
                `Anggy ${i}`,
                "address",
                "Indonesia"
            );
        }
    });

    it("should support create consumer and consumer group", async () => {
        await redis.xgroup("CREATE", "members", "group-1", "0");
        await redis.xgroup(
            "CREATECONSUMER",
            "members",
            "group-1",
            "consumer-1"
        );
        await redis.xgroup(
            "CREATECONSUMER",
            "members",
            "group-1",
            "consumer-2"
        );
    });

    it("should can consumer stream", async () => {
        const result = await redis.xreadgroup(
            "GROUP",
            "group-1",
            "consumer-1",
            "COUNT",
            2,
            "BLOCK",
            3000,
            "STREAMS",
            "members",
            ">"
        );
        expect(result).not.toBeNull();

        console.info(JSON.stringify(result, null, 2));
    });
});
