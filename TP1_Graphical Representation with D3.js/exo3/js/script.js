
// ============================================================
// FOOTBALL NETWORK - EXERCISE 3
// QUESTION 1: Force-directed graph
// QUESTION 2: Complete the datasets
// QUESTION 3: Improve the visualization
// QUESTION 4: Add interactions
// D3.js VERSION 3
// ============================================================


// ============================================================
// 1. INITIALIZATION
// ============================================================

var width = 1000;
var height = 650;

// Create the SVG drawing area
var svg = d3.select("#footballGraph")
    .append("svg")
    .attr("viewBox", "0 0 " + width + " " + height)
    .attr("preserveAspectRatio", "xMidYMid meet");

// Create a group containing all graph elements.
// Zoom and pan will be applied to this group.
var container = svg.append("g");

// Create the datasets
var Data = {
    nodes: [],
    links: []
};

// Display errors directly on the page
function showError(message) {
    var status = document.getElementById("message");

    status.textContent = message;
    status.className = "error";
}


// ============================================================
// 2. CHECK D3.JS AND LOAD THE DATASET
// QUESTION 2
// ============================================================

if (typeof d3 === "undefined") {

    showError("ERROR: D3.js could not be loaded. Check your internet connection.");

}
else {

    console.log("D3.js version:", d3.version);
    console.log("JavaScript started.");

    // Load the original Pajek file
    d3.text("data/football_data_unprocessed.txt", function(error, text) {

        // Check whether the file was loaded
        if (error) {

            console.error("Dataset loading error:", error);

            showError(
                "ERROR: Dataset not found. Check data/football_data_unprocessed.txt"
            );

            return;
        }

        console.log("Dataset loaded successfully!");

        // Divide the file into lines
        var lines = text.split(/\r?\n/);

        // Identify the current section
        var section = "";

        // Read every line
        lines.forEach(function(line) {

            line = line.trim();

            if (line === "") {
                return;
            }

            // Start of vertices section
            if (line.indexOf("*Vertices") === 0) {

                section = "vertices";
                return;
            }

            // Start of directed arcs section
            if (line === "*Arcs") {

                section = "arcs";
                return;
            }

            // Start of edges section
            if (line === "*Edges") {

                section = "edges";
                return;
            }

            // Separate values in the current line
            var parts = line.split(/\s+/);

            // Read vertices
            if (section === "vertices" && parts.length >= 4) {

                Data.nodes.push({

                    id: +parts[0],

                    name: parts[1].replace(/"/g, ""),

                    // Convert original coordinates to SVG coordinates
                    x: +parts[2] * width,

                    y: +parts[3] * height,

                    // Initialize connection counts
                    inDegree: 0,

                    outDegree: 0,

                    degree: 0

                });
            }

            // Read directed arcs
            else if (section === "arcs" && parts.length >= 3) {

                Data.links.push({

                    source: +parts[0],

                    target: +parts[1],

                    value: +parts[2]

                });
            }

            // No edges are present in this dataset

        });


        // ====================================================
        // 3. COMPLETE THE DATASETS
        // QUESTION 2
        // ====================================================

        // Create a table to find a node using its ID
        var nodesById = {};

        Data.nodes.forEach(function(node) {

            nodesById[node.id] = node;

        });

        // Convert source and target IDs into node objects
        // Calculate incoming, outgoing and total degrees
        var validLinks = [];

        Data.links.forEach(function(link) {

            var sourceNode = nodesById[link.source];
            var targetNode = nodesById[link.target];

            // Check that both vertices exist
            if (!sourceNode || !targetNode) {

                console.error("Invalid arc:", link);

                return;
            }

            // Keep the original IDs
            link.sourceId = link.source;
            link.targetId = link.target;

            // Replace IDs with actual node objects
            link.source = sourceNode;
            link.target = targetNode;

            // Count outgoing connections
            sourceNode.outDegree++;

            // Count incoming connections
            targetNode.inDegree++;

            // Count total incident connections
            sourceNode.degree++;
            targetNode.degree++;

            validLinks.push(link);

        });

        // Keep only valid links
        Data.links = validLinks;


        // Check the parsed dataset
        if (Data.nodes.length === 0) {

            showError("ERROR: No vertices were found in the dataset.");

            return;
        }

        console.log("Complete dataset:", Data);
        console.log("Vertices:", Data.nodes);
        console.log("Arcs:", Data.links);

        console.log("Number of vertices:", Data.nodes.length);
        console.log("Number of arcs:", Data.links.length);


        // ====================================================
        // 4. DISPLAY DATASET STATISTICS
        // QUESTION 2
        // ====================================================

        var message = document.getElementById("message");

        message.textContent = "Dataset loaded successfully!";
        message.className = "success";

        d3.select("#statistics")
            .html(
                '<div class="stat">' +
                    'Number of vertices' +
                    '<strong>' + Data.nodes.length + '</strong>' +
                '</div>' +

                '<div class="stat">' +
                    'Number of directed arcs' +
                    '<strong>' + Data.links.length + '</strong>' +
                '</div>' +

                '<div class="stat">' +
                    'Total connections' +
                    '<strong>' +
                        d3.sum(Data.links, function(d) {
                            return d.value;
                        }) +
                    '</strong>' +
                '</div>'
            );


        // ====================================================
        // 5. DISPLAY THE VERTICES TABLE
        // QUESTION 2
        // ====================================================

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


        // ====================================================
        // 6. DISPLAY THE ARCS TABLE
        // QUESTION 2
        // ====================================================

        var arcTable = d3.select("#arcs")
            .append("table");

        arcTable.append("thead")
            .append("tr")
            .html(
                "<th>Source team</th>" +
                "<th>Target team</th>" +
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


        // ====================================================
        // 7. COLORS AND SIZES
        // QUESTION 3
        // ====================================================

        // Five colors representing different degree groups
        var colors = [
            "#3498db",
            "#2ecc71",
            "#f1c40f",
            "#e67e22",
            "#e74c3c"
        ];

        // Find the maximum degree
        var maxDegree = d3.max(Data.nodes, function(d) {
            return d.degree;
        }) || 1;

        // Assign a color category according to degree
        var color = d3.scale.quantize()
            .domain([0, maxDegree])
            .range(colors);

        // Scale link thickness according to weight
        var maxWeight = d3.max(Data.links, function(d) {
            return d.value;
        }) || 1;

        var linkWidth = d3.scale.sqrt()
            .domain([0, maxWeight])
            .range([1, 5]);


        // ====================================================
        // 8. COLOR LEGEND
        // QUESTION 3
        // ====================================================

        var legendItems = [
            { color: colors[0], label: "Few connections" },
            { color: colors[1], label: "Low connections" },
            { color: colors[2], label: "Medium connections" },
            { color: colors[3], label: "High connections" },
            { color: colors[4], label: "Very high connections" }
        ];

        var legend = d3.select("#legend")
            .selectAll(".legend-item")
            .data(legendItems)
            .enter()
            .append("div")
            .attr("class", "legend-item");

        legend.append("span")
            .attr("class", "legend-color")
            .style("background-color", function(d) {
                return d.color;
            });

        legend.append("span")
            .text(function(d) {
                return d.label;
            });


        // ====================================================
        // 9. FORCE-DIRECTED LAYOUT
        // QUESTION 1
        // ====================================================

        var force = d3.layout.force()

            // Set graph nodes
            .nodes(Data.nodes)

            // Set graph links
            .links(Data.links)

            // Set graph dimensions
            .size([width, height])

            // Repulsion between nodes
            .charge(-350)

            // Distance between connected nodes
            .linkDistance(65)

            // Gravity toward the center
            .gravity(0.08)

            // Update positions at every simulation step
            .on("tick", tick);


        // ====================================================
        // 10. DRAW DIRECTED LINKS
        // QUESTION 1 AND QUESTION 3
        // ====================================================

        // Define arrow markers for directed arcs
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

            .style("fill", "#9aa5b1");


        // Create one line for every arc
        var link = container.selectAll(".link")

            .data(Data.links)

            .enter()

            .append("line")

            .attr("class", "link")

            .attr("marker-end", "url(#arrow)")

            // Link thickness depends on weight
            .style("stroke-width", function(d) {

                return linkWidth(d.value);

            });


        // Add a tooltip to each link
        link.append("title")
            .text(function(d) {

                return d.source.name + " → " +
                       d.target.name +
                       "\nWeight: " + d.value;

            });


        // ====================================================
        // 11. DRAW NODES
        // QUESTION 1 AND QUESTION 3
        // ====================================================

        var node = container.selectAll(".node")

            .data(Data.nodes)

            .enter()

            .append("circle")

            .attr("class", "node")

            // Larger degree means a larger circle
            .attr("r", function(d) {

                return 5 + Math.min(d.degree, 12) * 0.7;

            })

            // Color depends on degree
            .style("fill", function(d) {

                return color(d.degree);

            })

            // Enable drag and drop
            .call(force.drag);


        // ====================================================
        // 12. DISPLAY TEAM LABELS
        // QUESTION 3
        // ====================================================

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


        // ====================================================
        // 13. TOOLTIP FOR NODES
        // QUESTION 3
        // ====================================================

        node.append("title")

            .text(function(d) {

                return "Team: " + d.name +

                       "\nID: " + d.id +

                       "\nIncoming connections: " + d.inDegree +

                       "\nOutgoing connections: " + d.outDegree +

                       "\nTotal degree: " + d.degree;

            });


        // ====================================================
        // 14. ZOOM AND PAN
        // QUESTION 4
        // ====================================================

        var zoom = d3.behavior.zoom()

            // Minimum and maximum zoom
            .scaleExtent([0.3, 5])

            .on("zoom", function() {

                // Move and scale the graph container
                container.attr(

                    "transform",

                    "translate(" + d3.event.translate + ")" +

                    " scale(" + d3.event.scale + ")"

                );

            });

        // Activate zoom and pan on the SVG
        svg.call(zoom);

        // Disable double-click zoom
        svg.on("dblclick.zoom", null);


        // ====================================================
        // 15. HIGHLIGHT CONNECTED TEAMS
        // QUESTION 4
        // ====================================================

        // Create an adjacency table
        var connected = {};

        Data.nodes.forEach(function(d) {

            connected[d.id] = {};

        });

        // Record the neighbors of every node
        Data.links.forEach(function(d) {

            connected[d.source.id][d.target.id] = true;

            connected[d.target.id][d.source.id] = true;

        });


        // When the mouse enters a node
        node.on("mouseover", function(d) {

            // Make all nodes less visible
            node.style("opacity", 0.15);

            // Make all links less visible
            link.style("opacity", 0.08);

            // Make all labels less visible
            labels.style("opacity", 0.15);


            // Highlight the selected node
            d3.select(this)
                .style("opacity", 1);


            // Highlight links connected to the selected node
            link.filter(function(l) {

                return l.source.id === d.id ||
                       l.target.id === d.id;

            })

            .style("opacity", 1)

            .style("stroke", "#e74c3c");


            // Highlight neighboring nodes
            node.filter(function(n) {

                return connected[d.id][n.id];

            })

            .style("opacity", 1);


            // Highlight selected and neighboring labels
            labels.filter(function(n) {

                return n.id === d.id ||
                       connected[d.id][n.id];

            })

            .style("opacity", 1);

        });


        // When the mouse leaves a node
        node.on("mouseout", function() {

            // Restore nodes
            node.style("opacity", 1);

            // Restore links
            link.style("opacity", 0.55)
                .style("stroke", "#9aa5b1");

            // Restore labels
            labels.style("opacity", 1);

        });


        // ====================================================
        // 16. TICK FUNCTION
        // QUESTION 1
        // ====================================================

        function tick() {

            // Update link coordinates
            link

                .attr("x1", function(d) {
                    return d.source.x;
                })

                .attr("y1", function(d) {
                    return d.source.y;
                })

                .attr("x2", function(d) {
                    return d.target.x;
                })

                .attr("y2", function(d) {
                    return d.target.y;
                });


            // Update node coordinates
            node

                .attr("cx", function(d) {
                    return d.x;
                })

                .attr("cy", function(d) {
                    return d.y;
                });


            // Update label coordinates
            labels

                .attr("x", function(d) {
                    return d.x;
                })

                .attr("y", function(d) {
                    return d.y;
                });

        }


        // ====================================================
        // 17. START THE FORCE SIMULATION
        // QUESTION 1
        // ====================================================

        force.start();

        console.log("Force simulation started.");
        console.log("Football network is ready.");

    });

}
