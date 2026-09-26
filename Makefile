.PHONY: build plugin example

build: example

plugin:
	cd packages/astro-marimo && npm run build

example: plugin
	cd example && npm run build
