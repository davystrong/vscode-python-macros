# Python Macros

This provides a context menu item and command to run selected Python code and replace its output.

## Example

This:
```python
[x**2 for x in range(10)]
```

Becomes: 
```python
[0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

This:
```python
from math import sin, pi; [round(sin(x*2*pi/10)*128) for x in range(10)]
```

Becomes: 
```python
[0, 75, 122, 122, 75, 0, -75, -122, -122, -75]
```

It can also deal with multiline snippets. This:
```python
for x in range(3):
    print(x**3)
```

Becomes:
```python
0
1
8
```
