function xsi = tail(empirical,analytical)
%function xsi = tail(empirical,analytical)
% Estimate tail approximation

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
% Find the value of x where F(x) ~ 0.95
index_a1 = min(find(ycdf >= 0.95));
a1=xcdf(index_a1);
b=length(find(empirical >= a1));
a=length(find(analytical >= a1));
fprintf('b: %d len emp: %d a: %d len an: %d\n', b, length(empirical), a, length(analytical));
% Rescale a
a=a / length(analytical) * length(empirical);
xsi = log2(b / a);
