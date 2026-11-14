import numpy as np
import pytest
from science.analysis.support import box_profile, supported_fidelity

def test_common_support_preserves_flat_and_planar_analytic_slope():
    y,x=np.mgrid[:48,:48];z=10*x*1000+3*y*1000
    p=box_profile(z,np.ones(z.shape))
    assert p['metrics']['median_slope_deg']==pytest.approx(np.degrees(np.arctan(np.hypot(10,3))))
    assert p['metrics']['detrended_rms_m']<1e-7
    flat=box_profile(np.ones((48,48))*42,np.ones((48,48)))
    assert flat['metrics']['median_slope_deg']==0
    assert supported_fidelity(flat,flat,4000)['value']==pytest.approx(100)

def test_voids_and_unequal_support_do_not_create_fidelity():
    z=np.zeros((48,48));coverage=np.zeros((48,48))
    missing=box_profile(z,coverage)
    assert missing['metrics'] is None
    assert supported_fidelity(missing,missing,4000)['value'] is None
    a=box_profile(z,np.ones(z.shape));b=box_profile(z,np.ones(z.shape),support_m=12000)
    assert supported_fidelity(a,b,4000)['value'] is None
    assert supported_fidelity(a,a,5000)['value'] is None

def test_window_support_and_coverage_are_explicit():
    z=np.zeros((48,48));cov=np.ones(z.shape)*.95
    p=box_profile(z,cov,support_m=12000,offset=(4000,0))
    assert p['minimum_coverage']==pytest.approx(.95)
    assert p['contributing_width_m']==36000
    assert p['metrics']['gradient_baseline_m']==8000
    with pytest.raises(ValueError):box_profile(z,cov,support_m=4000)
    with pytest.raises(ValueError):box_profile(z,cov,offset=(20000,0))
