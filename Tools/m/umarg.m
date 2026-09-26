function [U] = umarg(Pr1, Pr2)
% function [U] = umarg(Pr1, Pr2)
%

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



Prob1 = Pr1(:,2)/100;
Prob2 = Pr2(:,2)/100;

index = find(Prob2 == 0);
Prob1_grant = Prob1(index);
Prob1(index) = [];
Prob2(index) = [];

U = (sum(Prob1.*(-log2(Prob2)+log2(Prob1))));

index = find(Prob1_grant == 0);
Prob1_grant(index) = [];
grant = sum(Prob1_grant.*(-log2(Prob1_grant)));

U = U + grant;



