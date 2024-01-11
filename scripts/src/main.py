import pathlib
import calendar

import rasterio
import numpy as np
from osgeo import gdal
from matplotlib import pyplot as plt
import pathlib
from jinja2 import Environment, PackageLoader, select_autoescape
import click


SPECIES_NAMES = ("Alle_alle", "Fratercula_arctica", "Fulmarus_glacialis", "Rissa_tridactyla", "Uria_aalge", "Uria_lomvia")
SPECIES_CODES = ("ALALL", "FRARC", "FUGLA", "RITRI", "URAAL", "URLOM")
SPECIES_MAP = {k:n for k,n in zip(SPECIES_CODES, SPECIES_NAMES)}


def to_month(label):
    return calendar.month_name[int(label[1:])]


def colorscale(source, colormap='viridis'):
    '''
    Convert a single band tif raster to COG applying a colormap
    Returns the path to the cog
    '''
    source_path = pathlib.Path(source)
    rgba_path = source_path.parent / (source_path.stem + '.tif.rgba')
    cog_path = source_path.parent / (source_path.stem + '.tif.cog')

    src = rasterio.open(source)

    if src.profile.get('count') > 1:
        raise Exception('Only grayscale single band raster are supported')

    # extract only the first band, mask nodata values
    band = src.read(1, masked=True)
    cmap = plt.get_cmap(colormap)

    # Normalize grayscale values between 0 and 1
    normalized_data = (band - band.min()) / (band.max() - band.min())

    # Apply the colormap to get RGBA values
    rgba_data = (cmap(normalized_data) * 255).astype(np.uint8)

    # Create a new profile
    profile = src.profile.copy()
    profile.update(dtype=rasterio.uint8, count=4, nodata=None, photometric='RGBA')

    with rasterio.open(str(rgba_path), 'w+', **profile) as dst:
        # the shape of the raster cannot be saved (x, y, bands)
        # so it's necessary to "roll" the axis (bands, x, y)
        dst.write(np.rollaxis(rgba_data, 2))

    src_ds = gdal.Open(str(rgba_path))

    # Create GDAL options for the COG transformation
    options = [
        'COMPRESS=DEFLATE',
        'TILING_SCHEME=GoogleMapsCompatible',
        'ADD_ALPHA=NO',
    ]


    # Set GDAL_NUM_THREADS to use all available CPUs
    gdal.SetConfigOption('GDAL_NUM_THREADS', 'ALL_CPUS')
    try:
        gdal.SetConfigOption('GDAL_CACHEMAX', '1024')
    except:
        pass

    # Translate and create the COG
    gdal.Translate(str(cog_path), src_ds, format='COG', creationOptions=options)

    src.close()
    rgba_path.unlink()
    return cog_path


def to_hierarchy(key_map, parent_key=""):
    layers = []
    for k in key_map.keys():
        id = '_'.join(filter(lambda x:x, [parent_key, k]))
        name = k
        if k.startswith('m'):
            name = to_month(k)
        elif k.startswith('c'):
            name = f'Colony {k[1:]}'
        else:
            name = SPECIES_MAP[k].replace('_', ' ')
    
        layer = {
            "id": id,
            "name": name,
        }
        if key_map[k]:
            layer['children'] = to_hierarchy(key_map[k], id)

        layers.append(layer)

    layers.sort(key=lambda x: x.get('id'))
    return layers

@click.command()
@click.argument("cog_directory")
@click.option("--output", help="write to output")
@click.option('--colormap', default='Reds', help="Matplotlib colormap to apply")
@click.option("--prefix", default="")
@click.option( "--template_path", default=".")
def generate_files(cog_directory, prefix, output, template_path, colormap):
    env = Environment(
        loader=PackageLoader('main'),
        autoescape=select_autoescape()
    )
    BASE = pathlib.Path(cog_directory)

    SOURCES = {}
    LAZY_SOURCES = {}

    SOURCES["osm"] = {
        "type": "raster",
        "tiles": [
            "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        ],
        "attribution": "&copy; <a href=\\\"https://www.openstreetmap.org/copyright\\\">OpenStreetMap</a> contributors &copy; <a href=\\\"https://carto.com/attributions\\\">CARTO</a>",
        "tileSize": 256
    }

    for filepath in BASE.iterdir():
        if not filepath.is_dir() and 'tif' in filepath.suffix:
            cog_path = colorscale(filepath, colormap=colormap)
            name, first_dot, rest = cog_path.name.partition('.')
            LAZY_SOURCES[name] = {
                "type": "raster",
                "url": f"cog:///{str(BASE.relative_to(prefix))}/{cog_path.name}"
            }
    
    template = env.get_template("style.json.tpl")
    
    with open(f'{output}/style.json', 'w+') as f:
        f.write(template.render({
            "sources": SOURCES,
            "layers": [{"id": k, "type": "raster", "source": k, "layout": {"visibility": "none" if k != "osm" else "visible"},}  for k in SOURCES.keys()]
        }))


    LAYERS = {}
    for k in LAZY_SOURCES.keys():
        try:
            species, colony, month = k.split("_")
            if not species in LAYERS:
                LAYERS[species] = {}

            if not colony in LAYERS[species]:
                LAYERS[species][colony] = {}

            LAYERS[species][colony][month] = {} 
        except ValueError:
            pass

    with open(f'{output}/metadata.json', 'w+') as f:
        template = env.get_template("metadata.json.tpl")
        f.write(template.render({
            "layers": to_hierarchy(LAYERS),
            "lazy_sources": LAZY_SOURCES,
            "lazy_layers": {k: {"id": k, "type": "raster", "source": LAZY_SOURCES[k]}  for k in LAZY_SOURCES.keys()}
        }))


if __name__ == '__main__':
    generate_files()
