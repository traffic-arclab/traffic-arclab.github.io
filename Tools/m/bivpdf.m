function bivpdf (seta,wa,setb,wb,bmin,bmax)
% function bivpdf (seta,wa,setb,wb,bmin,bmax)
% Plot the bivariate PDF of two variables ('seta' and 'setb')
% by using two bin widths ('wa' and 'wb')

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

bins = (min(seta)+wa/2):wa:max(seta);
bbins = (min(setb)+wb/2):wb:max(setb);
n=length(bins);
m=length(setb);
if (bmin==0 && bmax==0)
    bmin=1;
    bmax=length(bins);
end
N=length(seta);
old_res=0;
for i=bmin:bmax
    data = zeros(length(seta),1);
    data(find(seta>=(bins(i)-wa/2) & seta<(bins(i)+wa/2)))=setb(find(seta>=(bins(i)-wa/2) & seta<(bins(i)+wa/2)));
    set=data(find(data));
    [z(:,(i-bmin+1)),x1] = hist(set,bbins);
    if (sum(z(:,(i-bmin+1))))
        %z(:,(i-bmin+1)) = z(:,(i-bmin+1)) / sum(z(:,(i-bmin+1)));
        z(:,(i-bmin+1)) = z(:,(i-bmin+1)) / N;
    end
    res=floor(((i-bmin+1)/(bmax-bmin+1)*100));
    if(res ~= old_res)
        old_res=res;
        st=mat2str(res);
        disp(strcat(st,'% completed'))
    end
end
[xxs yys]=meshgrid(bins(bmin:bmax),bbins);
surf(xxs,yys,z);
