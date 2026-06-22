export function useOnboardingNavigation(
  step: number,
  setStep: (step: number) => void,
  role: string | null,
  gender: string | null,
  roleSubStep: 'select' | 'vetting',
  setRoleSubStep: (subStep: 'select' | 'vetting') => void,
  isInviteLinked?: boolean
) {

  const nextStep = () => {
    if (step === 1) {
      if (isInviteLinked) {
        setStep(4);
      } else if (gender === 'female') {
        setStep(3);
      } else {
        setStep(2);
        setRoleSubStep('select');
      }
    } else if (step === 2) {
      if (role === 'protector') {
        if (roleSubStep === 'select') {
          setRoleSubStep('vetting');
        } else {
          setStep(5);
        }
      } else if (role === 'guardian') {
        setStep(4);
      } else {
        setStep(3);
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
      setStep(1);
    } else if (step === 4) {
      if (isInviteLinked) {
        setStep(1);
      } else if (role === 'citizen') {
        setStep(3);
      } else {
        setStep(2);
        setRoleSubStep('select');
      }
    } else if (step === 5) {
      if (role === 'citizen') {
        setStep(4);
      } else if (role === 'protector') {
        setStep(2);
        setRoleSubStep('vetting');
      } else {
        setStep(4);
      }
    } else if (step === 6) {
      setStep(5);
    }
  };

  const getVisualStepInfo = () => {
    const isCitizen = role === 'citizen' || !role;
    const isMaleProtector = !isCitizen && gender === 'male';

    if (isInviteLinked) {
      // Step 1: Info (1), Step 4: PIN (2), Step 5: Shields (3), Step 6: Review (4)
      let current = step;
      if (step === 4) current = 2;
      if (step === 5) current = 3;
      if (step === 6) current = 4;
      return { current, total: 4, steps: [1, 2, 3, 4] };
    } else if (isCitizen) {
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
