import React from 'react';
import { CheckCircle, XCircle, Star, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import { Button } from './button';

/**
 * Component that displays a comparison of free vs premium features
 */
const PremiumFeatures = () => {
  const features = [
    {
      name: 'Message limit',
      free: '15 messages per session', 
      premium: 'Unlimited messages',
      icon: Zap
    },
    {
      name: 'Custom themes',
      free: false, 
      premium: true,
      icon: Star
    },
    {
      name: 'Save conversations',
      free: false, 
      premium: true,
      icon: Zap
    },
    {
      name: 'Export/import chats',
      free: false, 
      premium: true,
      icon: Zap
    },
    {
      name: 'Message branching',
      free: false, 
      premium: true,
      icon: Star
    },
    {
      name: 'Response regeneration',
      free: true, 
      premium: true,
      icon: Star
    },
    {
      name: 'Voice input',
      free: false, 
      premium: true,
      icon: Crown
    },
    {
      name: 'Markdown support',
      free: true, 
      premium: true,
      icon: Zap
    },
    {
      name: 'Suggested questions',
      free: true, 
      premium: true,
      icon: Zap
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="py-6 px-8 bg-purple-700 text-white">
        <h2 className="text-2xl font-bold">LOBO Chat Features</h2>
        <p className="mt-2 opacity-90">Sign in to unlock premium features</p>
      </div>
      
      <div className="py-6 px-8">
        <div className="grid grid-cols-7 gap-2 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="col-span-3 font-bold">Feature</div>
          <div className="col-span-2 font-bold text-center">Guest</div>
          <div className="col-span-2 font-bold text-center">Signed In</div>
        </div>
        
        {features.map((feature, index) => (
          <div key={index} className={`grid grid-cols-7 gap-2 py-3 ${
            index !== features.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
          }`}>
            <div className="col-span-3 flex items-center gap-2">
              <feature.icon size={16} className="text-purple-600" />
              <span>{feature.name}</span>
            </div>
            <div className="col-span-2 flex justify-center items-center">
              {typeof feature.free === 'string' ? (
                <span className="text-sm text-gray-600 dark:text-gray-400">{feature.free}</span>
              ) : feature.free ? (
                <CheckCircle size={18} className="text-green-500" />
              ) : (
                <XCircle size={18} className="text-gray-400" />
              )}
            </div>
            <div className="col-span-2 flex justify-center items-center">
              {typeof feature.premium === 'string' ? (
                <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">{feature.premium}</span>
              ) : feature.premium ? (
                <CheckCircle size={18} className="text-purple-600" />
              ) : (
                <XCircle size={18} className="text-gray-400" />
              )}
            </div>
          </div>
        ))}
        
        <div className="mt-6 flex justify-center gap-4">
          <Link href="/signin">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatures;