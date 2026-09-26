function fitting(emp_orig,empirical,w,b)
% function fitting(emp_orig,empirical,w,b)
% Perform Statistical fitting by comparing the empirical distribution given against several analytical
% distributions by means of the Lambda-square discrepancy measure. 
% It displays comparisons of the PDFs of each analytical distribution against the empirical one.
% It outputs also data formatted to be inserted into a latex table.
% TODO:
% - return the parameters of the best fitting distribution
% - improve memory usage by using normpdf etc. instead of normrnd etc. (normrnd can be used just
% for the lambda2 function but using a single vector to be rewritten each time).

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

s=zeros(7,2);
% for fitting algorithms which don't accept zeros
emp2=empirical;
emp2(find(emp2 == 0)) = 0.000001;

%len=round(length(empirical)/10);
%len=length(empirical);
%len=length(empirical)*3;
%len=length(empirical)*1;
%len=length(empirical)*100;
len=100000;
fprintf('Generating analytical distributions of %d samples\n\n', len);

fprintf('\\hline normal & ');
param = mle('norm',empirical);
fprintf('%.4f & %.4f &\n',param(1),param(2));
an = normrnd(param(1),param(2),1,len);
[s(1,1),s(1,2)]=workfit(emp_orig,empirical,w,b,an,param,'normal');

fprintf('\\hline exponential & ');
param = mle('exp',empirical);
fprintf('\\multicolumn{2}{c|}{%.4f} &\n',param);
an = exprnd(param,1,len);
[s(2,1),s(2,2)]=workfit(emp_orig,empirical,w,b,an,param,'exponential');

fprintf('\\hline weibull & ');
param = wblfit(emp2);
fprintf('%.4f & %.4f &\n',param(1),param(2));
an = wblrnd(param(1),param(2),1,len);
[s(3,1),s(3,2)]=workfit(emp_orig,empirical,w,b,an,param,'weibull');

fprintf('\\hline gamma & ');
param = mle('gam',empirical);
fprintf('%.4f & %.4f &\n',param(1),param(2));
an = gamrnd(param(1),param(2),1,len);
[s(4,1),s(4,2)]=workfit(emp_orig,empirical,w,b,an,param,'gamma');

fprintf('\\hline extreme & ');
param = mle('ev',empirical);
fprintf('%.4f & %.4f &\n',param(1),param(2));
an = evrnd(param(1),param(2),1,len);
[s(5,1),s(5,2)]=workfit(emp_orig,empirical,w,b,an,param,'extreme');

fprintf('\\hline lognormal & ');
param = lognfit(emp2);
fprintf('%.4f & %.4f &\n',param(1),param(2));
an = lognrnd(param(1),param(2),1,len);
[s(6,1),s(6,2)]=workfit(emp_orig,empirical,w,b,an,param,'lognorm');

fprintf('\\hline rayleigh & ');
param = mle('rayl',empirical);
fprintf('\\multicolumn{2}{c|}{%.4f} &\n',param);
an = raylrnd(param,1,len);
[s(7,1),s(7,2)]=workfit(emp_orig,empirical,w,b,an,param,'rayleigh');

%fprintf('geometric\n');
%param = mle('geo',empirical)
%an = geornd(param,1,len);
%workfit(emp_orig,empirical,w,b,an,param,'geometric');

%fprintf('poisson\n');
%param = mle('poiss',empirical)
%an = poissrnd(param,1,len);
%workfit(emp_orig,empirical,w,b,an,param,'poisson');

fprintf('\\hline uniform & ');
param = mle('unif',empirical);
fprintf('%.4f & %.4f &\n',param(1),param(2));
an = unifrnd(param(1),param(2),1,len);
[s(8,1),s(8,2)]=workfit(emp_orig,empirical,w,b,an,param,'uniform');

fprintf('lambda\t\tsigma\n');
s
best = bestlambda(s)
