from __future__ import division
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from mpl_toolkits.mplot3d import Axes3D
from subprocess import call
import numpy as np
import random
import time

fx = lambda t: t
fy = lambda t: t*0 + 1

t = np.arange(0, 1.1, 0.01)

points = [(0.5, 1.5), (1.25, 0), (1.75, 1.75)]

def distance(loca, locb):
    rand = random.random()
    difx = loca[0] - locb[0]
    dify = loca[1] - locb[1]
    return (difx**2 + dify**2)**0.5*(1+(rand - 0.5)*0.10)

coordinates = zip(fx(t), fy(t))

by_point = [(point, [distance(x, point) for x in coordinates]) for point in points]
by_point_dict = dict(by_point)

colors = ['g', 'b', 'y']
fig = plt.figure(1)
ax = fig.add_subplot(111)
j = 0
gs = gridspec.GridSpec(3, 4)
ax = fig.add_subplot(gs[:, :-1])
ax1 = fig.add_subplot(gs[0, -1])
ax2 = fig.add_subplot(gs[1, -1])
ax3 = fig.add_subplot(gs[2, -1])
axis_by_point = {}
axis_by_point[points[0]] = ax1
axis_by_point[points[1]] = ax2
axis_by_point[points[2]] = ax3

ax.get_yaxis().set_visible(False)
ax.get_xaxis().set_visible(False)

for p, a in axis_by_point.items():
    a.get_yaxis().set_visible(False)
    a.get_xaxis().set_visible(False)

for i in range(len(by_point[0][1])):
    j = 0
    for point, values in by_point:
        x, y = point
        r = values[i]
        circ = plt.Circle(point, radius=r, color=colors[j], fill=False)
        ax.add_patch(circ)
        j+=1

    for p, a in axis_by_point.items():
        a.plot(by_point_dict[p][:i])
    
    x = [x[0] for x in coordinates]
    y = [y[1] for y in coordinates]
    ax.plot(x, y)
    ax.axis([-1, 2, 0, 2])

    filepath = './test_frame{}.png'.format(i)
    fig.savefig(filepath, bbox_inches='tight')
    ax.cla()
    for p, a in axis_by_point.items():
        a.cla()

print('joining...')
conversion = call([
    "convert",
    "./test_frame%d.png[0-{}]".format(len(by_point[0][1])-1),
    "./test_animation_distorted.gif"
])
