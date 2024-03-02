import styled, { keyframes } from 'styled-components';

const stripeAnim = keyframes`
  0% {
    left: -60%;
    opacity: 0;
  }
  20% {
    opacity: 0.7;
  }
  50% {
    left: 60%;
    opacity: 1;
  }
  80% {
    opacity: 0.7;
  }
  100% {
    left: 120%;
    opacity: 0;
  }
`;

export const PlaceOptionOrderButton = styled.button`
  position: relative;
  display: inline-block;
  width: 100%;
  padding: 0.85em 0;
  background: transparent;
  border: 2px solid rgb(61, 106, 255);
  border-radius: 7px;
  color: #fff;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 2px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 2px 8px 0 rgba(61, 106, 255, 0.08);
  transition: background 0.2s ease-out, box-shadow 0.2s ease-out, border 0.2s, color 0.2s;
  outline: none;
  z-index: 1;

  &:hover {
    background: rgb(61, 106, 255);
    box-shadow: 0 0 30px 5px rgba(0, 142, 236, 0.815);
    border-color: rgb(61, 106, 255);
  }

  &:hover .stripe {
    animation: ${stripeAnim} 0.9s forwards;
  }

  &:active {
    background: transparent;
    box-shadow: none;
    border-color: rgb(61, 106, 255);
    color: #fff;
    transition: background 0.2s ease-in, box-shadow 0.2s ease-in;
  }

  .stripe {
    content: '';
    position: absolute;
    top: 0;
    left: -60%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.0) 100%);
    box-shadow: 0 0 30px 10px #fff;
    opacity: 0;
    transform: skewX(-20deg);
    pointer-events: none;
    z-index: 2;
  }

  @media (max-width: 500px) {
    font-size: 12px;
    padding: 0.7em 0;
  }
`;
