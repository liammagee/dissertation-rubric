// diagram.js

document.addEventListener('DOMContentLoaded', function() {
    // Get the container element's dimensions
    var container = document.getElementById('diagram-container');
    var width = container.offsetWidth;
    var height = 600; // Fixed height for the diagram

    // Create the Raphael paper
    var paper = Raphael('diagram-container', width, height);

    // After creating the paper
    paper.canvas.setAttribute('role', 'img');
    paper.canvas.setAttribute('aria-label', 'Interactive diagram of dissertation sections');


    // Define the center and radius for the circular layout
    var centerX = width / 2;
    var centerY = height / 2;
    var radius = 200; // Radius of the circle where the circles are placed
    var circleRadius = 50; // Radius of each section circle

    // Define the dissertation sections with descriptions
    var sections = [
        {
            section: 'introduction',
            description: 'Introduce the topic, provide background information, and state the research questions or hypotheses.'
        },
        {
            section: 'literature_review',
            description: 'Review existing literature related to your topic, identifying gaps your research will fill.'
        },
        {
            section: 'methodology',
            description: 'Explain the research methods you used to collect and analyze data.'
        },
        {
            section: 'findings_analysis',
            description: 'Present the results of your research and analyze them in the context of your study.'
        },
        {
            section: 'conclusion',
            description: 'Summarize your findings, discuss implications, and suggest areas for future research.'
        }
    ];


    // Calculate the positions of each section around the circle
    var angleStep = 360 / sections.length;
    var positions = [];

    for (var i = 0; i < sections.length; i++) {
        var angle = Raphael.rad(i * angleStep - 90); // Adjust so the first item is at the top
        var x = centerX + radius * Math.cos(angle);
        var y = centerY + radius * Math.sin(angle);
        positions.push({ 
            section: sections[i].section, 
            description: sections[i].description,
            x: x, 
            y: y, 
            angle: angle, 
            position: i });
    }

    // Function to calculate point on circle edge
    function pointOnCircle(cx, cy, angle, r) {
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
        };
    }

    // Draw arcs between steps
    for (var i = 0; i < positions.length; i++) {
        var startPos = positions[i];
        var endPos = positions[(i + 1) % positions.length];

        // Calculate adjusted start and end points on the edge of the circles
        var startPoint = pointOnCircle(startPos.x, startPos.y, startPos.angle + Raphael.rad(angleStep), circleRadius);
        var endPoint = pointOnCircle(endPos.x, endPos.y, endPos.angle - Raphael.rad(angleStep), circleRadius);

        // Calculate the arc path
        var pathString = [
            "M", startPoint.x, startPoint.y,
            "A", radius, radius, 0, 0, 1, endPoint.x, endPoint.y
        ].join(" ");

        var arc = paper.path(pathString).attr({
            'stroke': '#6c757d',
            'stroke-width': 2,
            'arrow-end': 'classic-wide-long'
        });
    }


    positions.forEach(function(pos, index) {
        // Draw circle
        var circle = paper.circle(pos.x, pos.y, circleRadius).attr({
            'fill': '#0d6efd',
            'stroke': 'none',
            'cursor': 'pointer'
        });


        // Set ARIA attributes
        circle.node.setAttribute('role', 'button');
        circle.node.setAttribute('aria-label', pos.section.replace('_', ' ') + ': ' + pos.description);
        circle.node.setAttribute('tabindex', '0'); // Make focusable

        // Keyboard interaction for the circle
        circle.node.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                // Prevent default action for spacebar to avoid scrolling
                event.preventDefault();
                // Simulate click
                window.location.href = '/' + pos.section;
            }
        });

        // Focus and blur events for keyboard navigation
        circle.node.addEventListener('focus', function() {
            // Show tooltip
            tooltipSet.attr({ 'opacity': 1 });
            circle.attr({ fill: '#0b5ed7' });
        });

        circle.node.addEventListener('blur', function() {
            // Hide tooltip
            tooltipSet.attr({ 'opacity': 0 });
            circle.attr({ fill: '#0d6efd' });
        });


        // Animate circles appearing
        circle.attr({ scale: '0,0', cx: pos.x, cy: pos.y });
        circle.animate({ scale: '1,1', cx: pos.x, cy: pos.y }, 500, 'bounce');
    
        // Hover effects
        circle.hover(
            function() { this.attr({ fill: '#0b5ed7' }); },
            function() { this.attr({ fill: '#0d6efd' }); }
        );
            
        // Create tooltip text element (initially hidden)
        var tooltip = paper.text(pos.x, pos.y - (circleRadius + 20), pos.description).attr({
            'fill': '#000',
            'font-size': 12,
            'text-anchor': 'left',
            'opacity': 0,
            'max-width': 150 // Optional: Limit the tooltip width
        });

        // Create a background rectangle for the tooltip
        var tooltipBBox = tooltip.getBBox();
        var tooltipRect = paper.rect(tooltipBBox.x - 5, tooltipBBox.y - 5, tooltipBBox.width + 10, tooltipBBox.height + 10, 5).attr({
            'fill': '#ffffcc',
            'stroke': '#333',
            'opacity': 0
        });

        // Place the text above the rectangle
        tooltip.toFront();

        // Group the tooltip elements
        var tooltipSet = paper.set();
        tooltipSet.push(tooltipRect, tooltip);

        tooltip.node.classList.add('raphael-tooltip-text');
        tooltipRect.node.classList.add('raphael-tooltip-rect');
        

        // Hover effects to show and hide tooltip
        circle.hover(
            function() {
                // Show tooltip
                tooltipSet.animate({ 'opacity': 1 }, 300);
                // Existing hover effect
                this.attr({ fill: '#0b5ed7' });
            },
            function() {
                // Hide tooltip
                tooltipSet.animate({ 'opacity': 0 }, 300);
                // Revert hover effect
                this.attr({ fill: '#0d6efd' });
            }
        );


        // Click event
        circle.click(function() {
            window.location.href = '/' + pos.section;
        });
    
        // Draw text
        var labelText = pos.section.replace('_', '\n').toUpperCase();
        var text = paper.text(pos.x, pos.y, labelText).attr({
            'fill': '#fff',
            'font-size': 12,
            'font-weight': 'bold',
            'text-anchor': 'middle'
        });
    
        text.node.setAttribute('aria-hidden', 'true');

        // Animate text appearing with the circle
        text.attr({ scale: '0,0', opacity: 0 });
        text.animate({ scale: '1,1', opacity: 1 }, 500, 'bounce');


    });

    

    // **Add Fainter Backward Arrows**

    // Define backward connections (e.g., from 'methodology' to 'introduction')
    var backwardConnections = [
        { from: 'literature_review', to: 'introduction' },
        { from: 'methodology', to: 'introduction' },
        { from: 'findings_analysis', to: 'introduction' }
        // Add more backward connections as needed
    ];

    backwardConnections.forEach(function(conn) {
        var fromPos = positions.find(p => p.section === conn.from);
        var toPos = positions.find(p => p.section === conn.to);

        if (fromPos && toPos) {
            console.log(fromPos);
            // Calculate adjusted start and end points on the edge of the circles
            // var startPoint = pointOnCircle(fromPos.x, fromPos.y, fromPos.angle - Raphael.rad(angleStep), circleRadius);
            // var endPoint = pointOnCircle(toPos.x, toPos.y, toPos.angle + Raphael.rad(angleStep), circleRadius);
            var startPoint = pointOnCircle(fromPos.x, fromPos.y, Math.PI + fromPos.angle, circleRadius);
            var endPoint = pointOnCircle(toPos.x, toPos.y, Math.PI + toPos.angle + Raphael.rad((fromPos.position - 1) * 15.0), circleRadius);

            // Calculate the arc path
            var pathString = [
                "M", startPoint.x, startPoint.y,
                "A", radius, radius, 0, 0, 1, endPoint.x, endPoint.y
            ].join(" ");

            var arc = paper.path(pathString).attr({
                'stroke': '#888888', // Fainter color
                'stroke-width': 1.5,
                'arrow-end': 'classic-wide-long',
                'stroke-dasharray': "--"
            });
        }
    });
});
