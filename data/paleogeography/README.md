# Paleogeography source

Deep Lens draws one reconstructed Earth per band, not per gate, so the files
here are keyed by age rather than by place.

| age | file | band |
|---|---|---|
| 70 Ma | `Map17_PALEOMAP_1deg_Late_Cretaceous_70Ma.nc` | late-cretaceous |
| 95 Ma | `Map22_PALEOMAP_1deg_Mid-Cretaceous_95Ma.nc` | mid-cretaceous |
| 475 Ma | `Map81.5_PALEOMAP_1deg_Early_Ordovician_475Ma.nc` | early-ordovician |

- Source: https://www.earthbyte.org/paleodem-resource-scotese-and-wright-2018/
- Dataset: Scotese, C. R. & Wright, N. (2018), PALEOMAP PaleoDEMs
- Resolution: 1 degree — about 111 km per cell, and the ceiling on anything drawn from it
- Values: estimated paleoelevation and paleobathymetry in metres
- License: Creative Commons Attribution 4.0 International

## Adding a band

The full archive covers 0-540 Ma in 5 Myr steps, 109 maps in a 9 MB zip, so any
band a future gate needs already has a map. Pull the one age you need rather
than the archive:

```bash
curl -sL -o all.zip https://www.earthbyte.org/webdav/ftp/Data_Collections/Scotese_Wright_2018_PaleoDEM/Scotese_Wright_2018_Maps_1-88_1degX1deg_PaleoDEMS_nc.zip
# extract the Map__ file whose name ends in the age you want, then delete the zip
python tools/render-paleodem-texture.py data/paleogeography/<file>.nc public/geo/paleodem-<age>.webp
```

The render script needs `Pillow`, `numpy`, and `netCDF4`, and turns a 1 degree
grid into a 4096x2048 WebP by drawing the shoreline as the 0 m boundary of the
field, shading the relief, and marking the shelf break. It adds legibility, not
resolution — see the note in the script before raising the exaggeration.
