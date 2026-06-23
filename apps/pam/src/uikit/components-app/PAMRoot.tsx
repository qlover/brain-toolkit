'use client';

import { useEffect } from 'react';
import { PAMFacade } from '@/impls/PAMfacade';
import { useIOC } from '../hook/useIOC';
import { useStore } from '../hook/useStore';

export function PAMRoot() {
  const pamFacade = useIOC(PAMFacade);
  const pamProjects = useStore(pamFacade.getSearchStore());

  useEffect(() => {
    pamFacade.pullProjectList();
  }, []);

  return (
    <div
      data-testid="PAMRoot"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <pre className="text-primary-text">
          {JSON.stringify(pamProjects, null, 2)}
        </pre>
      </div>
    </div>
  );
}
