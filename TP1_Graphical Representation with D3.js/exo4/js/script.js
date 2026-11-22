
/* =========================================================
   EXERCISE 4 - FOOTBALL NETWORK
   D3.js VERSION 3
   Questions 1, 2, 3 and 4
   ========================================================= */


/* =========================================================
   QUESTION 1 - FISH-EYE EFFECT
   Include the circular fish-eye plugin implementation.
   ========================================================= */

(function() {

    d3.fisheye = {

        circular: function() {

            var radius = 200;
            var distortion = 2;
            var k0;
            var k1;
            var focus = [0, 0];

            function fisheye(d) {

                var dx = d.x - focus[0];
                var dy = d.y - focus[1];

                var distance = Math.sqrt(dx * dx + dy * dy);

                if (distance === 0) {
                    return {
                        x: d.x,
                        y: d.y,
                        z: 10
                    };
                }

                if (distance >= radius) {
                    return {
                        x: d.x,
                        y: d.y,
                        z: 1
                    };
                }

                var k = k0 *
                    (1 - Math.exp(-distance * k1)) /
                    distance * 0.75 + 0.25;

                return {
                    x: focus[0] + dx * k,
                    y: focus[1] + dy * k,
                    z: Math.min(k, 10)
                };
            }

            function rescale() {

                k0 = Math.exp(distortion);

                k0 = k0 / (k0 - 1) * radius;

                k1 = distortion / radius;

                return fisheye;
            }

            fisheye.radius = function(value) {

                if (!arguments.length) {
                    return radius;
                }

                radius = +value;

                return rescale();
            };

            fisheye.distortion = function(value) {

                if (!arguments.length) {
                    return distortion;
                }

                distortion = +value;

                return rescale();
            };

            fisheye.focus = function(value) {

                if (!arguments.length) {
                    return focus;
                }

                focus = value;

                return fisheye;
            };

            return rescale();
        }
    };

})();


/* =========================================================
   INITIALIZATION
   ========================================================= */

var width = 1100;
var height = 700;

var Data = {
    nodes: [],
    links: []
};

var initialPositions = [];

var svg = d3.select("#footballGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("preserveAspectRatio", "xMidYMid meet");


/* =========================================================
   FISH-EYE CONFIGURATION
   Radius = 200
   Distortion = 2
   ========================================================= */

var fisheye = d3.fisheye.circular()
    .radius(200)
    .distortion(2);


/* =========================================================
   FISH-EYE LENS INDICATOR
   ========================================================= */

var lens = svg.append("circle")
    .attr("class", "lens")
    .attr("r", fisheye.radius())
    .style("fill", "#7db7e8")
    .style("fill-opacity", 0.04)
    .style("stroke", "#2878b5")
    .style("stroke-width", 1.5)
    .style("stroke-dasharray", "6,5")
    .style("pointer-events", "none")
    .style("display", "none");


/* =========================================================
   GRAPH CONTAINER
   ========================================================= */

var container = svg.append("g");


/* =========================================================
   LOAD DATASET
   ========================================================= */

d3.text("data/football_data_unprocessed.txt", function(error, text) {

    if (error) {

        console.error("Dataset loading error:", error);

        d3.select("#message")
            .style("color", "#c0392b")
            .text("ERROR: Cannot load the dataset. Check the data folder.");

        return;
    }

    console.log("Dataset loaded successfully.");


    /* =====================================================
       QUESTION 2 - COMPLETE THE DATASETS
       Parse Pajek vertices and arcs.
       ===================================================== */

    var lines = text.split(/\r?\n/);

    var section = "";

    lines.forEach(function(line) {

        line = line.trim();

        if (line === "") {
            return;
        }

        // Detect the vertices section
        if (line.indexOf("*Vertices") === 0) {

            section = "vertices";

            return;
        }

        // Detect the directed arcs section
        if (line === "*Arcs") {

            section = "arcs";

            return;
        }

        // Detect the undirected edges section
        if (line === "*Edges") {

            section = "edges";

            return;
        }

        var parts = line.split(/\s+/);


        // Read vertices
        if (section === "vertices") {

            Data.nodes.push({

                id: +parts[0],

                name: parts[1].replace(/"/g, ""),

                x: +parts[2] * width,

                y: +parts[3] * height,

                inDegree: 0,

                outDegree: 0,

                degree: 0

            });
        }


        // Read directed arcs
        else if (section === "arcs") {

            Data.links.push({

                source: +parts[0],

                target: +parts[1],

                value: +parts[2]

            });
        }

    });


    /* =====================================================
       CONVERT NODE IDS INTO NODE OBJECTS
       ===================================================== */

    var nodesById = {};

    Data.nodes.forEach(function(node) {

        nodesById[node.id] = node;

    });


    // Convert each link's source and target IDs
    Data.links.forEach(function(link) {

        var sourceId = link.source;
        var targetId = link.target;

        link.source = nodesById[sourceId];
        link.target = nodesById[targetId];

        if (!link.source || !link.target) {

            console.error("Invalid link:", sourceId, targetId);

            return;
        }

        // Calculate outgoing degree
        link.source.outDegree++;

        // Calculate incoming degree
        link.target.inDegree++;

        // Calculate total degree
        link.source.degree++;
        link.target.degree++;

    });


    // Stop if no vertices were found
    if (Data.nodes.length === 0) {

        d3.select("#message")
            .style("color", "#c0392b")
            .text("ERROR: No vertices found in the dataset.");

        return;
    }


    /* =====================================================
       DISPLAY DATASET STATISTICS
       ===================================================== */

    d3.select("#message")
        .text("Dataset loaded successfully!");

    d3.select("#statistics")
        .html(

            '<div class="stat-card">' +
                '<span>Vertices</span>' +
                '<strong>' + Data.nodes.length + '</strong>' +
            '</div>' +

            '<div class="stat-card">' +
                '<span>Directed arcs</span>' +
                '<strong>' + Data.links.length + '</strong>' +
            '</div>' +

            '<div class="stat-card">' +
                '<span>Fish-eye radius</span>' +
                '<strong>200</strong>' +
            '</div>' +

            '<div class="stat-card">' +
                '<span>Distortion</span>' +
                '<strong>2</strong>' +
            '</div>'

        );


    /* =====================================================
       DISPLAY THE VERTICES TABLE
       ===================================================== */

    var vertexTable = d3.select("#vertices")
        .append("table");

    vertexTable.append("thead")
        .append("tr")
        .html(
            "<th>ID</th>" +
            "<th>Team</th>" +
            "<th>In-degree</th>" +
            "<th>Out-degree</th>" +
            "<th>Total degree</th>"
        );

    var vertexRows = vertexTable.append("tbody")
        .selectAll("tr")
        .data(Data.nodes)
        .enter()
        .append("tr");

    vertexRows.each(function(d) {

        var row = d3.select(this);

        row.append("td").text(d.id);
        row.append("td").text(d.name);
        row.append("td").text(d.inDegree);
        row.append("td").text(d.outDegree);
        row.append("td").text(d.degree);

    });


    /* =====================================================
       DISPLAY THE ARCS TABLE
       ===================================================== */

    var arcTable = d3.select("#arcs")
        .append("table");

    arcTable.append("thead")
        .append("tr")
        .html(
            "<th>Source</th>" +
            "<th>Target</th>" +
            "<th>Weight</th>"
        );

    var arcRows = arcTable.append("tbody")
        .selectAll("tr")
        .data(Data.links)
        .enter()
        .append("tr");

    arcRows.each(function(d) {

        var row = d3.select(this);

        row.append("td").text(d.source.name);
        row.append("td").text(d.target.name);
        row.append("td").text(d.value);

    });


    /* =====================================================
       SAVE INITIAL NODE POSITIONS
       Used by the reset button.
       ===================================================== */

    Data.nodes.forEach(function(node) {

        initialPositions.push({

            id: node.id,

            x: node.x,

            y: node.y

        });

    });


    /* =====================================================
       COLORS AND SCALES
       ===================================================== */

    var color = d3.scale.category10();

    var maxWeight = d3.max(Data.links, function(d) {
        return d.value;
    }) || 1;

    var linkWidth = d3.scale.sqrt()
        .domain([0, maxWeight])
        .range([1, 5]);


    /* =====================================================
       QUESTION 2 - FORCE LAYOUT
       Parameters from the exercise:
       size = [width, height]
       charge = -400
       linkDistance = 40
       ===================================================== */

    var force = d3.layout.force()

        .nodes(Data.nodes)

        .links(Data.links)

        .size([width, height])

        .charge(-400)

        .linkDistance(40)

        .on("tick", tick);


    /* =====================================================
       QUESTION 3 - CREATE DIRECTED LINKS
       ===================================================== */

    var defs = svg.append("defs");

    defs.append("marker")

        .attr("id", "arrow")

        .attr("viewBox", "0 -5 10 10")

        .attr("refX", 18)

        .attr("refY", 0)

        .attr("markerWidth", 5)

        .attr("markerHeight", 5)

        .attr("orient", "auto")

        .append("path")

        .attr("d", "M0,-5L10,0L0,5")

        .style("fill", "#8192a5");


    var link = container.selectAll(".link")

        .data(Data.links)

        .enter()

        .append("line")

        .attr("class", "link")

        .attr("marker-end", "url(#arrow)")

        .style("stroke-width", function(d) {

            return linkWidth(d.value);

        });


    /* =====================================================
       QUESTION 3 - CREATE COLORED NODES
       ===================================================== */

    var node = container.selectAll(".node")

        .data(Data.nodes)

        .enter()

        .append("circle")

        .attr("class", "node")

        .attr("r", function(d) {

            return 5 + Math.min(d.degree, 10) * 0.7;

        })

        .style("fill", function(d) {

            return color(Math.floor(d.degree / 3));

        });


    /* =====================================================
       QUESTION 3 - TEAM LABELS
       ===================================================== */

    var labels = container.selectAll(".label")

        .data(Data.nodes)

        .enter()

        .append("text")

        .attr("class", "label")

        .text(function(d) {

            return d.name;

        })

        .attr("dx", 10)

        .attr("dy", 4);


    /* =====================================================
       TOOLTIP
       ===================================================== */

    node.append("title")

        .text(function(d) {

            return "Team: " + d.name +

                "\nID: " + d.id +

                "\nIncoming arcs: " + d.inDegree +

                "\nOutgoing arcs: " + d.outDegree +

                "\nTotal degree: " + d.degree;

        });


    /* =====================================================
       QUESTION 4 - DRAG AND DROP
       ===================================================== */

    var drag = force.drag()

        .on("dragstart", function(d) {

            d.fixed = true;

            d3.select(this)
                .style("stroke", "#e67e22")
                .style("stroke-width", 3);

        })

        .on("dragend", function(d) {

            d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", 1.8);

        });

    node.call(drag);


    /* =====================================================
       RENDER THE FISH-EYE POSITIONS
       ===================================================== */

    function renderFishEye() {

        // Calculate distorted position of every node
        Data.nodes.forEach(function(d) {

            d.fisheye = fisheye(d);

        });


        // Update links using distorted node positions
        link

            .attr("x1", function(d) {
                return d.source.fisheye.x;
            })

            .attr("y1", function(d) {
                return d.source.fisheye.y;
            })

            .attr("x2", function(d) {
                return d.target.fisheye.x;
            })

            .attr("y2", function(d) {
                return d.target.fisheye.y;
            });


        // Update nodes and enlarge them near the focus
        node

            .attr("cx", function(d) {
                return d.fisheye.x;
            })

            .attr("cy", function(d) {
                return d.fisheye.y;
            })

            .attr("r", function(d) {

                var baseRadius = 5 + Math.min(d.degree, 10) * 0.7;

                return baseRadius * Math.sqrt(d.fisheye.z);

            });


        // Update labels
        labels

            .attr("x", function(d) {
                return d.fisheye.x;
            })

            .attr("y", function(d) {
                return d.fisheye.y;
            })

            .style("font-size", function(d) {

                return (10 * Math.sqrt(d.fisheye.z)) + "px";

            });

    }


    /* =====================================================
       QUESTION 1 - MOUSEMOVE FISH-EYE INTERACTION
       ===================================================== */

    svg.on("mousemove", function() {

        // Get mouse coordinates inside the SVG
        var mousePosition = d3.mouse(this);

        // Move the fish-eye focus to the mouse
        fisheye.focus(mousePosition);

        // Move the visible lens
        lens

            .style("display", "block")

            .attr("cx", mousePosition[0])

            .attr("cy", mousePosition[1]);

        // Redraw distorted graph
        renderFishEye();

    });


    /* =====================================================
       RESTORE NORMAL VIEW WHEN MOUSE LEAVES
       ===================================================== */

    svg.on("mouseleave", function() {

        fisheye.focus([-10000, -10000]);

        lens.style("display", "none");

        renderFishEye();

    });


    /* =====================================================
       QUESTION 3 - HIGHLIGHT CONNECTED TEAMS
       ===================================================== */

    var neighbors = {};

    Data.nodes.forEach(function(d) {

        neighbors[d.id] = {};

    });

    Data.links.forEach(function(d) {

        neighbors[d.source.id][d.target.id] = true;

        neighbors[d.target.id][d.source.id] = true;

    });


    node.on("mouseover.highlight", function(d) {

        node.style("opacity", 0.15);

        link.style("opacity", 0.08);

        labels.style("opacity", 0.15);


        d3.select(this)
            .style("opacity", 1);


        link.filter(function(l) {

            return l.source.id === d.id ||
                   l.target.id === d.id;

        })

        .style("opacity", 1)

        .style("stroke", "#e74c3c");


        node.filter(function(n) {

            return neighbors[d.id][n.id];

        })

        .style("opacity", 1);


        labels.filter(function(n) {

            return n.id === d.id ||
                   neighbors[d.id][n.id];

        })

        .style("opacity", 1);

    });


    node.on("mouseout.highlight", function() {

        node.style("opacity", 1);

        link.style("opacity", 0.55)
            .style("stroke", "#9aa7b5");

        labels.style("opacity", 1);

    });


    /* =====================================================
       QUESTION 2 - TICK FUNCTION
       Update positions after each force simulation step.
       ===================================================== */

    function tick() {

        // The fish-eye changes only displayed positions.
        // The force simulation keeps the original x and y.
        renderFishEye();

    }


    /* =====================================================
       RESET BUTTON
       ===================================================== */

    d3.select("#resetButton")
        .on("click", function() {

            Data.nodes.forEach(function(node) {

                var original = initialPositions.filter(function(p) {

                    return p.id === node.id;

                })[0];

                node.x = original.x;
                node.y = original.y;

                node.px = original.x;
                node.py = original.y;

                node.fixed = false;

            });

            fisheye.focus([-10000, -10000]);

            lens.style("display", "none");

            force.start();

            renderFishEye();

        });


    /* =====================================================
       START FORCE SIMULATION
       ===================================================== */

    force.start();

    renderFishEye();

    console.log("Exercise 4 completed successfully.");
    console.log("Vertices:", Data.nodes.length);
    console.log("Arcs:", Data.links.length);
    console.log("Complete dataset:", Data);

});
