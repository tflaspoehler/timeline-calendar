lines = open('imcdates.html', 'r').readlines()

title_lines = [i for i in range(0, len(lines)) if 'flexible-content-market-show-title' in lines[i]]

for i in title_lines:
	print lines[i]