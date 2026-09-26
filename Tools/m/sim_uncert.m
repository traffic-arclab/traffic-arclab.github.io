function [result]=sim_uncert(data,bins)
% function [result]=sim_uncert(data,bins)
% evaluate the simmetrical uncertainty
% of the bivariate dataset data by using 
% the number of bins specified by bins

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

base=2;                         %defines the base of the log for the entropy
n1 = hist3(data,[bins bins]);   %calculates the 3d histogram of the dataset
Pxy=n1./sum(sum(n1));           %calculates the joit probability mass function (pmf)
Px=sum(n1)/sum(sum(n1));        %calculates the marginal pmf of the rows of the dataset
Py=sum(n1')/sum(sum(n1'));      %calculates the marginal pmf of the columns of the dataset
mi=mutual_info(Px,Py,Pxy,base);     %calculates the mutual information of the two random variables

result=2*mutual_info(Px,Py,Pxy,2)/(entropy_base(Px,base)+entropy_base(Py,base)); %calculates the final result
