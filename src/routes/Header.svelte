<script>
	let time;
	function updateTime(){
		time = new Date().toTimeString().split(' ')[0];
	}

	setInterval(updateTime, 1000)

</script>

<header class="container">
	<nav>
		<ul>
		  <li><strong>Cortese WAY</strong></li>
		</ul>
		<ul><li>{time}</li></ul>
		<ul>
		  <li><a href="#">About</a></li>
		  <li><a href="#">Services</a></li>
		  <li><a href="#">Products</a></li>
		</ul>
	  </nav>

</header>