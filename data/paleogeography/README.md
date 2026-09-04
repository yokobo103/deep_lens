# 95 Ma paleogeography source

`Map22_PALEOMAP_1deg_Mid-Cretaceous_95Ma.nc` is the 1-degree PALEOMAP
PaleoDEM time slice distributed by EarthByte in the Scotese & Wright (2018)
PaleoDEM archive. The NetCDF metadata identifies the underlying reconstruction
as 97.2 Ma; Deep Lens presents it as the archive's rounded 95 Ma time slice.

- Source: https://www.earthbyte.org/paleodem-resource-scotese-and-wright-2018/
- Dataset: Scotese, C. R. & Wright, N. (2018), PALEOMAP PaleoDEMs
- Resolution: 1 degree
- Values: estimated paleoelevation and paleobathymetry in metres
- License: Creative Commons Attribution 4.0 International

Generate the browser texture with:

```powershell
python tools/render-paleodem-texture.py data/paleogeography/Map22_PALEOMAP_1deg_Mid-Cretaceous_95Ma.nc public/geo/paleodem-95.png
```

The render script requires `Pillow`, `numpy`, and `netCDF4`.
