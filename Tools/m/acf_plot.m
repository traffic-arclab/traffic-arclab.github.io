function acf_plot(empirical,directory,variable)
% plots the autocorrelation function
% until lag 100 if the size of the empirical 
% data is greater than 100

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

% Autocorrelation function plot
maxlag=100;
if(size(empirical,2)<100)
    maxlag=size(empirical,1)-1;
end,
[ACF,Lags,Bounds] = autocorr(empirical,maxlag);
x=0:1:maxlag;
y1 = ones(1,maxlag+1) * 0.05;
y2 = ones(1,maxlag+1) * (-0.05);
h = figure;
h1 = stem(x,ACF,'fill','-');
set(get(h1,'BaseLine'),'LineStyle',':')
set(h1,'MarkerFaceColor','red')
hold;
plot(x,y1,'r--',x,y2,'r--');
[s1,err] = sprintf('The Autocorrelation Plot - %s',variable);
title(s1);
xlabel('Lag');
ylabel('Correlation Coefficient');
ymin = min(-0.2,min(ACF));
axis([0 maxlag ymin - 0.1 max(ACF) + 0.1]);
[s2,err] = sprintf('%s\\%s_Autocorrelation',directory,variable);
print_figure(s2,h);

% ACF(1)

[s,err] = sprintf('ACF(1) : %g\n',ACF(2));
disp(s);
