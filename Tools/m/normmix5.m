function [p, m, s, x, pdf, an] = normmix5(data, iter, flag)
%function [p, m, s, x, pdf, an] = normmix5(data, iter, flag)
%Perform statistical fitting using the Expectation Maximization algorithm with a mixture of 2 Gaussian distributions.
%
% INPUT
% data:		data to be fitted
% iter:		max number of iterations (0 = default)
% flag:		OPTIONAL:
%		0	do nothing
%		1	plot a comparison of the PDFs
%
% OUTPUT
% p:		percentages
% m:		param1
% s:		param2
% x:		x for the pdf
% pdf:		y for the pdf
% an:		OPTIONAL: generate 100k random numbers following the obtained mixture

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

n = 5;
options = statset('MaxIter',iter, 'MaxFunEvals',iter*n);

md=min(data);
Md=max(data);
k= (Md - md) / (n + 1);

start = [ ones(n-1, 1) / n; (md+k:k:md+n*k)'; ones(n, 1)]';
low = [ zeros(n-1, 1); -Inf*ones(n, 1); zeros(n,1)]';
up = [ ones(n-1, 1); Inf*ones(2*n, 1)]';

if iter == 0
	param = mle(data, 'pdf', @gauss_mixture, 'start', start);
else
	param = mle(data, 'pdf', @gauss_mixture, 'start', start, 'options', options);
end
p = [param(1:n-1) (1-sum(param(1:n-1)))];
m = param(n:2*n-1);
s = param(2*n:end);

x=md:(Md - md)/1000:Md;
pdf = p(1)*normpdf(x,m(1),s(1)) + p(2)*normpdf(x,m(2),s(2)) + p(3)*normpdf(x,m(3),s(3)) + p(4)*normpdf(x,m(4),s(4)) + p(5)*normpdf(x,m(5),s(5));


% Optional: Generate 100000 random numbers following the mixture
if nargout > 5
	an = [normrnd(m(1), s(1), 1, int32(100000 * p(1))) , normrnd(m(2), s(2), 1, int32(100000 * p(2))) , normrnd(m(3), s(3), 1, int32(100000 * p(3))), normrnd(m(4), s(4), 1, int32(100000 * p(4))), normrnd(m(5), s(5), 1, int32(100000 * p(5)))]; 
end

% Optional: Plot a comparison between the two PDFs
if flag > 0
	figure; hold;
	pdfplot(data, 'b', 1); plot(x, pdf, 'r'); legend('empirical', 'analytical');
	plot(x, p(1)*normpdf(x,m(1),s(1)), 'k-.');
	plot(x, p(2)*normpdf(x,m(2),s(2)), 'k-.');
	plot(x, p(3)*normpdf(x,m(3),s(3)), 'k-.');
	plot(x, p(4)*normpdf(x,m(4),s(4)), 'k-.');
	plot(x, p(5)*normpdf(x,m(5),s(5)), 'k-.');
end



function [y] = gauss_mixture(x, p1, p2, p3, p4, m1, m2, m3, m4, m5, s1, s2, s3, s4, s5)
	n = 5;
	p = [p1 p2 p3 p4 (1-p1-p2-p3-p4)];
	m = [m1 m2 m3 m4 m5];
	s = [s1 s2 s3 s4 s5];
	y = zeros(size(x));
	for k = 1:n
		y = y + p(k)*normpdf(x,m(k),s(k));
	end
