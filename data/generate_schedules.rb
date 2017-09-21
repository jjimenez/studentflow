require 'json'
fname = 'mock_schedules.json'
student_count = 10
$output = true
$verbose = false

$class_count_choices = []

def make_class_counts
	class_counts = [[1,8],[2,12],[3,20],[4,30],[5,30]]
	class_counts.each do | count, weight |
	  weight.times { $class_count_choices << count }
	end
end

$mwf_choices = []
$tth_choices = []
$buildings = []

def make_buildings
  $buildings = [
	{ acronym: 'AB', location: [41.66395546, -91.540628]},
	{ acronym: 'ABW', location: [41.66515645, -91.54154452]},
	{ acronym: 'BCSB', location: [41.66051651, -91.53814778]},
	{ acronym: 'BB', location: [41.6619594, -91.53343721]},
	{ acronym: 'BBE', location: [41.66163802, -91.53269515]},
	{ acronym: 'CB', location: [41.66416396, -91.53669859]},
	{ acronym: 'CPHB', location: [41.66421533, -91.54248773]},
	{ acronym: 'EPB', location: [41.660807, -91.53993524]},
	{ acronym: 'GH', location: [41.6609204, -91.54768142]},
	{ acronym: 'HA', location: [41.670519, -91.537412]},
	{ acronym: 'MH', location: [41.6618921, -91.53565891]},
	{ acronym: 'MLH', location: [41.66070936, -91.5365319]},
	{ acronym: 'NH', location: [41.6660369, -91.53662689]},
	{ acronym: 'PBB', location: [41.66316507, -91.53524909]},
	{ acronym: 'PH', location: [41.66179326, -91.5341506]},
	{ acronym: 'SH', location: [41.66070553, -91.53567616]},
	{ acronym: 'SC', location: [41.65965786, -91.53682024]},
	{ acronym: 'SSH', location: [41.66193726, -91.5312837]},
	{ acronym: 'TB', location: [41.66668759, -91.53937594]},
	{ acronym: 'TH', location: [41.66339087, -91.53661995]},
	{ acronym: 'VAN', location: [41.66204896, -91.53223998]},
	{ acronym: 'VAB', location: [41.666187, -91.54161]},
	{ acronym: 'VOX', location: [41.657441, -91.535111]},
	{ acronym: 'SHC', location: [41.66043623, -91.54991592]}
  ]
  
end
def make_start_times
	mwf_start_counts = []
	[8,17,18,19].each do |hour|
	   mwf_start_counts << [hour, 1]
	end 
	[9,10,11,13,14,15,16].each do |hour|
	   mwf_start_counts << [hour, 15]
	end
	mwf_start_counts.each do | hour, weight |
	   weight.times { $mwf_choices << hour } 
	end
	tth_start_counts = []
	[8,17,19].each do |hour|
	   tth_start_counts << [hour, 1]
	end 
	[10,13,15].each do |hour|
	   tth_start_counts << [hour, 15]
	end 
	tth_start_counts.each do | hour, weight |
	   weight.times { $tth_choices << hour } 
	end
end

def make_student(id)
  student_id = 'student'+ id.to_s
  class_count = $class_count_choices.sample
  class_starts = [];
  classes = [];
  # class starts will be a tuple where the first part is 'mwf' or 'tth' and the second is the time
  for i in 1..class_count
      puts 'creating class ' + i.to_s if $verbose
      dow = ([0,1].sample == 0) ? 'mwf' : 'tth'
      choices = (dow == 'mwf') ? $mwf_choices : $tth_choices
      start_time = choices.sample
      while class_starts.include?([dow,start_time]) do
      	start_time = choices.sample
      end
      class_starts << [dow,start_time]
      start_time = start_time * 1.0
      end_time = dow == 'mwf' ? start_time + (50.0 / 60.0) : start_time + 1 + (15.0/60.0)
      end_time = end_time.round(2)
      puts "choosing building" if $verbose
      building_choice = $buildings.sample
      puts "chose building" if $verbose
   
      this_class = { student_id: student_id, dow: dow, start_time: start_time, end_time: end_time, building: building_choice}
      classes << this_class
  end
  return classes

end

make_class_counts
make_start_times
make_buildings

$handle = File.open fname, 'w'
header = '{ "slots": ['

footer = "]}"
puts header if $output

$handle.puts header
(1..student_count).each do |n|
  puts 'creating classes for student: ' + n.to_s if $verbose
  classes = make_student(n)
  last_student = (n == student_count)
  class_count = classes.size - 1
  classes.each_with_index do |section, index|
          add_comma = (!last_student) || class_count != index ? ', ' : ''
	  puts section.to_json + add_comma if $output
	  $handle.puts section.to_json + add_comma
  end
  puts 'done creating classes for student: ' + n.to_s if $verbose
end
puts footer if $output
$handle.puts footer
$handle.close

