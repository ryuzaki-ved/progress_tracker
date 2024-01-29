import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  align-items: center;
  width: 400px;
  height: 50px;
  border: 2px solid #ffc000;
  border-radius: 30px;
  position: relative;
  background: #fff;
  box-sizing: border-box;
  overflow: hidden;
  @media (max-width: 500px) {
    width: 100%;
    min-width: 220px;
    height: 44px;
  }
`;

const SlidingBg = styled.div<{ selected: number }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: ${props => (props.selected === 1 ? '#e53935' : '#ffc000')};
  border-radius: 30px;
  transition: transform 0.4s cubic-bezier(0.77, 0, 0.175, 1), background 0.3s cubic-bezier(0.77, 0, 0.175, 1);
  transform: translateX(${props => (props.selected === 1 ? '100%' : '0%')});
  z-index: 1;
`;

const OptionLabel = styled.label<{ selected: boolean; $sell?: boolean }>`
  flex: 1;
  text-align: center;
  z-index: 2;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: ${props => (props.selected ? 'bold' : 'normal')};
  color: ${props =>
    props.selected
      ? props.$sell
        ? '#fff'
        : '#212121'
      : '#7d7d7d'};
  transition: color 0.3s, font-size 0.3s cubic-bezier(0.77, 0, 0.175, 1);
  line-height: 50px;
  user-select: none;
  @media (max-width: 500px) {
    font-size: 1rem;
    line-height: 44px;
  }
`;

const HiddenRadio = styled.input.attrs({ type: 'radio' })`
  display: none;
`;

interface ToggleSwitchProps {
  value: 'buy' | 'sell';
  onChange: (value: 'buy' | 'sell') => void;
  option1Label?: string;
  option2Label?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onChange,
  option1Label = 'Buy',
  option2Label = 'Sell',
  className,
}) => {
  return (
    <Container className={className}>
      <SlidingBg selected={value === 'sell' ? 1 : 0} />
      <HiddenRadio
        id="buy"
        name="tradeType"
        checked={value === 'buy'}
        onChange={() => onChange('buy')}
      />
      <OptionLabel htmlFor="buy" selected={value === 'buy'}>
        {option1Label}
      </OptionLabel>
      <HiddenRadio
        id="sell"
        name="tradeType"
        checked={value === 'sell'}
        onChange={() => onChange('sell')}
      />
      <OptionLabel htmlFor="sell" selected={value === 'sell'} $sell={true}>
        {option2Label}
      </OptionLabel>
    </Container>
  );
}; 