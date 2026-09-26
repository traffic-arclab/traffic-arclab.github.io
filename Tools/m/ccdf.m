function alpha=ccdf(empirical,cutmin)
%function alpha=ccdf(empirical,cutmin)
% Display log-log Complementary CDFs

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

[ycdf, xcdf] = cdfcalc(empirical);
% Align ycdf and xcdf (see "help cdfcalc")
ycdf = ycdf(2:length(ycdf));

% Discard elements negative or null for logarithm
discard1 = find(xcdf <= 0);
xcdf(discard1) = [];
ycdf(discard1) = [];
discard2 = find((1-ycdf) <= 0);
xcdf(discard2) = [];
ycdf(discard2) = [];
x1 = xcdf;
y1 = log10(1-ycdf);
% Discard elements smaller than "cutmin"
xalpha = x1;
yalpha = y1;
if (cutmin ~= 0)
     discard = find(x1 <= cutmin);
     xalpha(discard) = [];
     yalpha(discard) = [];
end

% Computing alpha parameter
xa = min(xalpha)-0.1:(max(xalpha)-min(xalpha))/10:max(xalpha)+0.1;
%xa = 0:(max(xalpha)-min(xalpha))/10:max(xalpha)+0.1;
p = polyfit(xalpha,yalpha,1);
ya = p(1) * xa + p(2);
alpha = -p(1);

% Plot
plot(x1,y1,'b-',xa,ya,'r--');
title(sprintf('Complementary CDF of interarrival times'));
xlabel('[x] = 1E-6 s');
ylabel(sprintf('log10(1-F(x))'));
%legend('Empirical CCDF','Linear fit');
%[s1,err] = sprintf('%s\\LOG_COMPL_CDF',directory);
%print_figure(s1);
grid
