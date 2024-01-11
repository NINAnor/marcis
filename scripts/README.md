# Generate data script

Upload the data in `data` folder. For example `seabirds` will contain all the `.tif` files.

```bash
docker compose build
docker compose run cli /app/data/seabirds --output /app/data/seabirds --prefix /app/
```

This will convert all the rasters to cog, applying a colorscale based on `Reds`. It will also create the required files (`metadata.json`, `style.json`) in the output directory. `prefix` allows to "remove" from the `cog` path the prefix that is served by nginx.
