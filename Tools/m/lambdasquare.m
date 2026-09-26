function [x2,lambda2,dev] = lambdasquare(empirical,analytical,param,bins,mmin,mmax)
% Estimates lambda2 discrepancy 
% [x2,lambda2,dev] = lambdasquare(empirical,analytical,param,bins,min,max)
% param = parameters of the analytical distribution
% bins = custom bins vector or bin width
% min,max:
% Use 0,0 to not make any truncations
% Use 1,1 to truncate analytical to match min and max from empirical
% Use different values to truncate both distros at your pleasure.

% Copyright (c) 2004-2006 Alessio Botta, Alberto Dainotti, Antonio Pescapè
% Email: {a.botta , alberto , pescape }@unina.it
% DIS - Dipartimento di Informatica e Sistemistica 
% University of Napoli Federico II, ITALY
% All rights reserved.
%
% Redistribution and use in source and binary forms, with or without
% modification, are permitted provided that the following conditions
% are met:
% 1. Redistributions of source code must retain the above copyright
%    notice, this list of conditions and the following disclaimer.
% 2. Redistributions in binary form must reproduce the above copyright
%    notice, this list of conditions and the following disclaimer in the
%    documentation and/or other materials provided with the distribution.
% 3. Redistributions of source code or in binary form must clearly reproduce
%    the reference to the web site from which they were downloaded.
%
% THIS SOFTWARE IS PROVIDED BY THE AUTHOR AND CONTRIBUTORS ``AS IS'' AND
% ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
% IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
% ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
% FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
% DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
% OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
% HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
% LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
% OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
% SUCH DAMAGE.

if length(bins) == 1 % User supplied a specific bin width
	w = bins;
end

% Truncations
if mmin == mmax
	if mmin ~= 0
		% Truncate analytical to match min and max from empirical
		analytical = analytical(find(analytical >= min(empirical) & analytical <= max(empirical)));
		if length(bins) == 1 % User supplied a specific bin width
			bins = (min(empirical)+w/2):w:max(empirical);
		end
	else
		% Do not make any truncations
		if length(bins) == 1 % User supplied a specific bin width
			bins = (min(min(empirical),min(analytical))+w/2):w:max(max(empirical),max(analytical));
		end
	end
else
	% Truncate both to mmin and mmax
	analytical = analytical(find(analytical >= mmin & analytical <= mmax));
	empirical = empirical(find(empirical >= mmin & empirical <= mmax));
	if length(bins) == 1 % User supplied a bin width
		bins = (min(min(empirical),min(analytical))+w/2):w:max(max(empirical),max(analytical));
	end
end

% Just for ease
n = length(empirical);

% Compute histograms
y = hist(empirical, bins); % y = absolute frequency of the empirical distro
z = hist(analytical, bins); % z = absolute frequency of the analytical distro

% Check if analytical has zero frequency bins
if (min(abs(z))) == 0 
	fprintf('Warning: There are bins with zero frequency in analytical.\n');
	fprintf('This should be avoided ! Anyway I''m skipping them..\n');
	fprintf('On a total of %d bins ', length(bins));
	bins = bins(find(z ~= 0));
	y = y(find(z ~= 0));
	z = z(find(z ~= 0));
	fprintf('I''m keeping %d of them.\n', length(bins));
end

% Check if empirical has zero frequency bins
if (min(abs(y))) == 0 
	fprintf('Warning: There are bins with zero frequency in empirical.\n');
	fprintf('The computation of the formula is correct, but the chosen bin width probably not..\n');
end

% Compute chi-square discrepancy
% Expected freq = number of samples of empirical * relative frequency of i_th bin of analytical 
npi = n * (z/length(analytical));
x2 = sum( ((y-npi).^2) ./ npi );

% Compute lambda-square discrepancy
D = y - npi;
E = npi;
k = sum(D ./ E);
df = length(bins) - 1 - length(param);
lambda2 = (x2 - k - df)/(n-1);

% Compute variance associated with this estimate of lambda2
T = sum( (D.^3 -2*(D.*E) + 5/2*(D.^2) + 3/2*(D+E)) ./ (E.^2) );
dev = sqrt(2*df + 4*n*lambda2 + 4*n*lambda2^2 + 4*T) / n;
