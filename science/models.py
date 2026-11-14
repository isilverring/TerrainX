"""Validation at the serialized scientific dataset boundary."""
from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, model_validator


class SourceReference(BaseModel):
    id: str
    title: str
    url: str
    organization: str


class NASAObservation(BaseModel):
    value: float | None
    monthly: list[float | None]
    unit: str
    long_name: str
    provenance: dict


class EarthStudyRegion(BaseModel):
    id: str
    name: str
    bounds: list[float]
    rationale: str


class EarthCandidate(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    name: str
    region_id: str
    latitude: float = Field(ge=-90,le=90)
    longitude: float = Field(ge=-180,le=180)
    benchmark: bool
    status: Literal["REFERENCE ANALOG","SCREENED CANDIDATE","CHARACTERIZED CANDIDATE"]
    climate: dict
    terrain: dict
    geology: dict
    assessments: dict
    source_refs: list[str]

    @model_validator(mode="after")
    def check_benchmark(self):
        if self.benchmark and self.status != "REFERENCE ANALOG":
            raise ValueError("Benchmark must remain separately labelled")
        if not self.source_refs:
            raise ValueError("Candidate needs provenance")
        return self


class Dataset(BaseModel):
    schema_version: Literal["1.0"]
    generated_at: str
    regions: list[EarthStudyRegion]
    candidates: list[EarthCandidate]
    targets: list[dict]
    sources: list[SourceReference]
    summary: dict
    config: dict
