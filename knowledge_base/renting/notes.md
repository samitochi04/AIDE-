# AIDE+ Renting Knowledge Base - Documentation

## Overview
Comprehensive database of all rental platforms, real estate sites, and housing resources available in France. Covers everything from major real estate portals to niche student housing, social housing, and colocation platforms.

---

## Categories

### 1. Major Real Estate Portals
Large platforms aggregating listings from agencies and individuals.

### 2. Direct Owner Platforms (Particulier à Particulier)
Sites where owners list directly - no agency fees.

### 3. Student Housing
CROUS, private residences, student-focused platforms.

### 4. Colocation (Flatsharing)
Platforms specifically for shared housing.

### 5. Furnished Rentals
Short to medium-term furnished apartments.

### 6. Social Housing (Logement Social)
HLM and affordable housing resources.

### 7. Temporary/Corporate Housing
Relocation services and temporary housing.

### 8. Luxury Rentals
High-end property platforms.

### 9. Mobile Apps
Best apps for rental search.

### 10. Guarantor Services
Visale, GarantMe, and alternatives.

---

## Data Structure Schema

```json
{
  "metadata": {
    "version": "string",
    "lastUpdated": "date",
    "description": "string"
  },
  "platforms": {
    "majorPortals": [...],
    "directOwner": [...],
    "studentHousing": [...],
    "colocation": [...],
    "furnished": [...],
    "socialHousing": [...],
    "temporary": [...],
    "luxury": [...],
    "apps": [...],
    "guarantorServices": [...]
  },
  "tips": {...},
  "scamPrevention": {...}
}
```

---

## Platform Entry Structure

```json
{
  "id": "string",
  "name": "string",
  "url": "string",
  "type": "portal|direct|student|colocation|furnished|social|temporary|luxury",
  "description": "string",
  "languages": ["FR", "EN"],
  "hasApp": boolean,
  "agencyFees": boolean,
  "priceRange": "€|€€|€€€",
  "coverage": "national|regional|city",
  "features": [...],
  "pros": [...],
  "cons": [...],
  "tips": [...]
}
```

---

## Progress Tracker

### ✅ COMPLETED
| Category | Platforms | Status |
|----------|-----------|--------|
| Major Portals | SeLoger, Leboncoin, Bien'ici, etc. | ✅ |
| Direct Owner | PAP, Leboncoin, etc. | ✅ |
| Student Housing | CROUS, Studapart, Lokaviz, etc. | ✅ |
| Colocation | La Carte des Colocs, Appartager, etc. | ✅ |
| Furnished | Lodgis, Spotahome, etc. | ✅ |
| Social Housing | Demande-logement-social.gouv.fr, etc. | ✅ |
| Temporary | Relocations services | ✅ |
| Luxury | High-end platforms | ✅ |
| Apps | Mobile applications | ✅ |
| Guarantor Services | Visale, GarantMe, etc. | ✅ |

---

## Key Resources

### Official
| Resource | URL | Purpose |
|----------|-----|---------|
| Service-Public.fr | service-public.fr | Official rental rights |
| ANIL | anil.org | Free housing advice |
| ADIL | adil.org | Local housing info |
| CAF | caf.fr | Housing aid (APL/ALS) |

### Scam Prevention
- **Never pay before visiting**
- **Never wire money abroad**
- **Meet landlord in person**
- **Use official platforms**

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-09 | Complete rental platforms database |
