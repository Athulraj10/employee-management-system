import './LoadingAnimation.css';

interface LoadingAnimationProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingAnimation({ text = 'loading', size = 'medium' }: LoadingAnimationProps) {
  return (
    <div className={`wifi-loader wifi-loader-${size}`}>
      <svg className="circle-outer">
        <circle className="back" cx="50%" cy="50%" r="40%"></circle>
        <circle className="front" cx="50%" cy="50%" r="40%"></circle>
      </svg>
      <svg className="circle-middle">
        <circle className="back" cx="50%" cy="50%" r="40%"></circle>
        <circle className="front" cx="50%" cy="50%" r="40%"></circle>
      </svg>
      <svg className="circle-inner">
        <circle className="back" cx="50%" cy="50%" r="40%"></circle>
        <circle className="front" cx="50%" cy="50%" r="40%"></circle>
      </svg>
      {text && (
        <div className="text" data-text={text}></div>
      )}
    </div>
  );
}

