export function useOnboardingNavigation(
  step: number,
  setStep: (step: number) => void,
  role: string | null,
  gender: string | null,
  roleSubStep: 'select' | 'vetting',
  setRoleSubStep: (subStep: 'select' | 'vetting') => void
) {

  const nextStep = () => {
    if (step === 1) {
      setStep(2);
      setRoleSubStep('select');
    } else if (step === 2) {
      if (role === 'citizen') {
        setStep(3);
      } else {
        if (roleSubStep === 'select') {
          setRoleSubStep('vetting');
        } else {
          if (gender === 'male') {
            setStep(5);
          } else {
            setStep(4);
          }
        }
      }
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      setStep(6);
    }
  };

  const handleBack = () => {
    if (step === 1) return;
    if (step === 2) {
      if (roleSubStep === 'vetting') {
        setRoleSubStep('select');
      } else {
        setStep(1);
      }
    } else if (step === 3) {
      setStep(2);
      setRoleSubStep('select');
    } else if (step === 4) {
      if (role === 'citizen') {
        setStep(3);
      } else {
        setStep(2);
        setRoleSubStep('vetting');
      }
    } else if (step === 5) {
      if (role === 'citizen') {
        setStep(4);
      } else {
        if (gender === 'male') {
          setStep(2);
          setRoleSubStep('vetting');
        } else {
          setStep(4);
        }
      }
    } else if (step === 6) {
      setStep(5);
    }
  };

  const getVisualStepInfo = () => {
    const isCitizen = role === 'citizen' || !role;
    const isMaleProtector = !isCitizen && gender === 'male';

    if (isCitizen) {
      return { current: step, total: 6, steps: [1, 2, 3, 4, 5, 6] };
    } else if (isMaleProtector) {
      let current = step;
      if (step === 5) current = 3;
      if (step === 6) current = 4;
      return { current: current, total: 4, steps: [1, 2, 3, 4] };
    } else {
      let current = step;
      if (step === 4) current = 3;
      if (step === 5) current = 4;
      if (step === 6) current = 5;
      return { current: current, total: 5, steps: [1, 2, 3, 4, 5] };
    }
  };

  return { nextStep, handleBack, getVisualStepInfo };
}
