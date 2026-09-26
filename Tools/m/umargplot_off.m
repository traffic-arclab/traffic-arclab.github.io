function [newset,entr,um]=umargplot_off (empir,n,w)
% function [newset,entr,um]=umargplot_off (empir,n,w)
% Compute Offline-Marginal Utility
%
% Input variables:
% empir = the entire dataset to reduce
% n = numbers of splitting intervals
% w = bin width for entropy calculations
%
% Output variables:
% newset = reduced dataset
% entr = original data set entropy
% um = marginal utility discarded by using the reduced data set
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



bins = (min(empir)+w/2):w:max(empir);
Pr = [bins', zeros(length(bins), 1)];
[Pr(:,2), Pr(:,1)] = hist(empir, bins);
Pr(:,2) = Pr(:,2) * (100 / length(empir));
%
p = Pr(:,2)/100;
nozero = find(p);
x=p;
x(nozero)=log2(p(nozero));
entr = -sum(p.*x);
%
toll = entr/200; %tollerance 200 times smaller than dataset entropy
Pr1 = [bins', zeros(length(bins), 1)];
[Pr1(:,2), Pr1(:,1)] = hist(empir, bins);
Pr1(:,2) = Pr1(:,2) * (100 / length(empir));
newset=[];
Nempir=length(empir);
s=zeros(n,1);
while (isempty(newset))
    step = length(empir)/n;
    for i=1:n
        subset=empir(1:floor(i*step));
        %Pr2 = prob_plot_new(subset,bins);
	Pr2 = [bins', zeros(length(bins), 1)];
	[Pr2(:,2), Pr2(:,1)] = hist(subset, bins);
	Pr2(:,2) = Pr2(:,2) * (100 / length(subset));
        s(i)=umarg(Pr1,Pr2);
        completed = floor((i/n)*100)
    end
    si=max(find(s > toll));
    snip=ceil((si+1)*step);
    um = s(si+1);
    newset=empir(1:snip);
    if (isempty(newset))
        empir=empir(1:ceil(step));
        disp('Step is too big for actual tollerance: reducing dataset')
    end
end
Nnewset=length(newset);
perc_redux=fix((Nnewset/Nempir)*100);
[s1, err]=sprintf('Dataset reduction: %d%%',perc_redux);
disp(s1)
x = linspace(0,length(empir),n);
figure;
plot(x, s,'b--','LineWidth',2);
xlabel('number of samples');
ylabel('Marginal Utility');
title('Marginal Utility');
