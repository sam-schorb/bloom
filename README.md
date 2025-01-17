# Bloom

A simple live-coding playground for creating SVG art with JavaScript. This is very much a work in progress, but the core functionality lets you write and execute code in real-time to create SVG shapes.

## What's working so far

- Basic live coding environment with instant feedback
- Simple SVG shape creation (circles for now)
- Code error handling
- Auto-appending shapes to canvas (no need to write `.appendTo(canvas)`)

## Running it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) to see the app.

## Example

Try this in the editor:

```javascript
circle(100);
```

## What's coming next

- More shape types (polygons, paths, etc.)
- Animation capabilities
- Shape transformations
- Color utilities
- Better error handling
- Probably lots of other stuff - this is just the beginning

## Tech

Built with Next.js 14 and Tailwind CSS. Keeping it simple for now.

## Contributing

Feel free to experiment with this! It's very early stages but if you want to help out, PRs are welcome. Just keep in mind things might change a lot as I figure out what this wants to be.

## License

MIT
