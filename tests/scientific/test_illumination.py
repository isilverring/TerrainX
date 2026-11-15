import math
import numpy as np
import pytest
from science.analysis.illumination import local_basis,sun_angles,sampled_horizon,horizon_at,light_summary

def test_basis_is_orthonormal_at_poles_and_equator():
    for lat in [-90,0,89.9]:
        basis=np.array(local_basis(lat,23))
        assert np.allclose(basis@basis.T,np.eye(3),atol=1e-12)

def test_sun_vector_zenith_and_cardinal_directions():
    east,north,up=local_basis(-87,45)
    assert sun_angles(up,-87,45)[1]==pytest.approx(90)
    assert sun_angles(east,-87,45)==pytest.approx((90,0),abs=1e-10)
    assert sun_angles(north,-87,45)==pytest.approx((0,0),abs=1e-10)

def test_horizon_uses_real_height_obstructions_and_refuses_missing_grid():
    flat=np.zeros((7,7));h=sampled_horizon(flat,4000,-87,0)
    assert max(h['elevation_deg'])==0
    ridge=flat.copy();ridge[0,:]=1000
    rh=sampled_horizon(ridge,4000,-87,0)
    assert rh['elevation_deg'][0]>0
    ridge[1,1]=np.nan
    with pytest.raises(ValueError):sampled_horizon(ridge,4000,-87,0)

def test_horizon_wrap_and_summary_censoring_are_explicit():
    assert horizon_at(np.array([0,360,90]),[0,10,20,30]).tolist()==pytest.approx([0,0,10])
    s=light_summary([-1,-1,10,-1],[0,0,0,0],[0,0,0,0],2)
    assert s['visible_fraction']==.25
    assert s['max_sampled_dark_run_hours']==4
    assert s['boundary_darkness_censored'] is True
    with pytest.raises(ValueError):light_summary([math.nan],[0],[0]*4)
