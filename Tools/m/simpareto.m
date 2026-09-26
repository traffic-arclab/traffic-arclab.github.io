function [sample] = simpareto(npoints, alpha)
% SIMPARETO random numbers from Pareto distribution: 
%   pdf   f(x)=alpha/(1+x)^(1+alpha), x>0
%   cdf   F(x)=1-1/(1+x)^alpha, x>0
%   inverse cdf G(y)=(1-y)^(-1/alpha)-1, 0<y<1
%
% [sample] = simpareto(npoints, alpha)
%
% Inputs: npoints - sample size
%         alpha - parameter of the distribution. Should be
%           positive. 
%
% Outputs: sample - vector of random numbers
%
% See also SIMBINOM, SIMDISCR, SIMEXP, SIMGEOM

% Authors: R.Gaigalas, I.Kaj
% v1.2 04-Oct-02

  % check arguments
  if (alpha <= 0)
    error('alpha negative or zero');
  end

  % generate a uniform sample and apply the inverse cdf
  sample = (1-rand(1, npoints)).^(-1/alpha)-1;

