# Scoped geological cases — evidence and contradictions

These two cases investigate existing algorithmically selected cells. They are not field discoveries, and they do not silently change original or expanded model scores. The source input is the reviewed extraction `data/source/site_evidence.json`; its SHA-256 is the hash of that curated file, not of a whole publication. Reproduce coordinate conversion, distance and window tests with `.venv\Scripts\python.exe scripts/build_site_evidence.py`. Output: `data/derived/site_evidence.json` and the matching public file, pinned in the science release.

## Moon cell −23°, −70°

Oliveros et al. (2007), Table 1a, p.212, reports VO193 at23°04′48″S69°57′30″W as basaltic-andesite lava, and VO191 at23°04′53″S69°56′11″W as andesite lava. Converted positions lie9.865 and11.148km from the cell centre, within the approximate ±12km terrain window. The published VO193 locality in the La Negra Formation, Mantos Blancos–Baquedano area, is a defensible named research subsite. It is already published; no first-discovery claim follows.

This supports volcanic observation/sampling questions while contradicting a uniformly basaltic interpretation. It does not confirm material at the screening centre or a proposed station. The table's datum/positional uncertainty was not established by review. Exact exposure, access, alteration and laboratory material classification remain unvalidated. Primary source: https://doi.org/10.5027/andgeoV34n2-a03 and https://www.andeangeology.cl/index.php/revista1/article/download/V34n2-a03/490 . The source review parsed the published table; a visual PDF screenshot could not be obtained. No field survey was performed.

## Mars cell −21.5°,25.625°

Published Makgadikgadi work provides regional process context. Franchi et al. (2022) Table 1 reports a Southern Sua Pan–Mosu core at−21.18837°,26.04583°,55.681km from this candidate centre and outside its terrain window. Its measured mineralogy, biology and stratigraphy are not transferred. Schmidt et al. (2023) discusses fault/groundwater and Martian playa processes, particularly Meridiani/Arabia Terra; it does not validate a local Jezero delta/carbonate subsite. No named subsite inside this window was verified.

Sources: https://doi.org/10.3389/fevo.2022.818417 and https://doi.org/10.3389/fspas.2023.1108386 . This is an explicitly unresolved local hypothesis, with reconnaissance/stratigraphic logging/mineral identification recommended. Negative or insufficient-exposure outcomes are valid.

## Application and proposal semantics

Cases, DNA and Passport display the local/regional distinction and source positions separately from NASA measurements and the cell centre. Expedition JSON includes the reviewed evidence. “Use literature-informed field proposal” initializes the corresponding deterministic hypothesis, procedure and equipment. Its complete JSON and full shared link retain the protocol's pinned release; compact QR retains its documented narrower scope. Completion indicators are proposed protocol checks, not observed scientific results. Polar utility remains unassessed and no lunar/Mars environmental equivalence is inferred.
