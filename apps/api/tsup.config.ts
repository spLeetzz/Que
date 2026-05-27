import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["./src/index.ts"],
	noExternal: ["@"], // transpile packages starting with `@` and their dependencies
	splitting: false,
	bundle: true,
	outDir: "./dist",
	clean: true,
	env: { IS_SERVER_BUILD: "true" },
	loader: { ".json": "copy" },
	minify: true,
	sourcemap: false,
});
